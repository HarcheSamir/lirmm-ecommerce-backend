const prisma = require('../../config/prisma');
const { sendMessage } = require('../../kafka/producer');
const { products } = require('../../utils/seed')

const fetchAndFormatProductForKafka = async (productId) => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            categories: { include: { category: { select: { name: true, slug: true } } } },
            variants: { select: { attributes: true, price: true, stockQuantity: true, id: true } },
            images: { select: { id: true, imageUrl: true, altText: true, isPrimary: true, order: true }, orderBy: { order: 'asc' } }
        }
    });
    if (!product) { console.warn(`[Kafka Helper] Product ${productId} not found.`); return null; }
    
    const categories = product.categories || [];
    const variants = product.variants || [];
    const images = product.images || [];

    const category_names = categories.map(pc => pc.category?.name).filter(Boolean);
    const category_slugs = categories.map(pc => pc.category?.slug).filter(Boolean);
    
    const primaryImage = images.find(img => img.isPrimary === true) || images[0] || null;

    const kafkaPayload = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        averageRating: product.averageRating,
        reviewCount: product.reviewCount,
        primaryImageUrl: primaryImage ? primaryImage.imageUrl : null,
        category_names: category_names,
        category_slugs: category_slugs,
        variants: variants.map(v => ({ id: v.id, attributes: v.attributes || {}, price: v.price, stockQuantity: v.stockQuantity })),
        variant_attributes_flat: variants.flatMap(v => Object.entries(v.attributes || {}).map(([key, value]) => `${key}:${value}`)).filter((v, i, a) => a.indexOf(v) === i),
        images: images.map(img => ({
            id: img.id,
            imageUrl: img.imageUrl,
            altText: img.altText,
            isPrimary: img.isPrimary,
            order: img.order
        })),
    };
    return kafkaPayload;
};

const validateLeafCategories = async (tx, categoryIds) => {
    if (!categoryIds || categoryIds.length === 0) return;
    const categories = await tx.category.findMany({
        where: { id: { in: categoryIds } },
        include: { _count: { select: { children: true } } }
    });
    const nonLeafCategories = categories.filter(c => c._count.children > 0);
    if (nonLeafCategories.length > 0) {
        const invalidNames = nonLeafCategories.map(c => c.name).join(', ');
        throw { statusCode: 409, message: `Products can only be assigned to leaf categories. The following are not leaf categories: ${invalidNames}.` };
    }
};

const createManyProducts = async (req, res, next) => {
    try {
        const productsData = products;
        if (!Array.isArray(productsData) || productsData.length === 0) {
            return res.status(400).json({ message: 'Request body must be a non-empty array of product objects.' });
        }
        if (productsData.find(p => !p.sku || !p.name)) {
            return res.status(400).json({ message: `All products in the array must have 'sku' and 'name'.` });
        }

        const creationDate = new Date('2022-10-17T00:00:00Z'); // fixed creation date

        let createdProductSummaries = [];
        await prisma.$transaction(async (tx) => {
            for (const productData of productsData) {
                const { sku, name, description, isActive, variants: inputVariants, categoryIds, categorySlugs, images: inputImages } = productData;
                let finalCategoryIds = categoryIds || [];
                if (categorySlugs && categorySlugs.length > 0) {
                    const foundCategories = await tx.category.findMany({ where: { slug: { in: categorySlugs } }, select: { id: true, slug: true } });
                    if (foundCategories.length !== categorySlugs.length) {
                        const notFoundSlugs = categorySlugs.filter(slug => !foundCategories.find(cat => cat.slug === slug));
                        throw { statusCode: 400, message: `The following category slugs do not exist: ${notFoundSlugs.join(', ')}` };
                    }
                    finalCategoryIds = [...new Set([...finalCategoryIds, ...foundCategories.map(cat => cat.id)])];
                }
                await validateLeafCategories(tx, finalCategoryIds);

                const newProduct = await tx.product.create({
                    data: { sku, name, description, isActive, createdAt: creationDate }
                });

                createdProductSummaries.push({ id: newProduct.id, sku: newProduct.sku });

                if (finalCategoryIds.length > 0) {
                    await tx.productCategory.createMany({
                        data: finalCategoryIds.map(catId => ({ productId: newProduct.id, categoryId: catId })),
                        skipDuplicates: true
                    });
                }

                if (inputVariants && inputVariants.length > 0) {
                    const createdVariants = await Promise.all(
                        inputVariants.map(variant => tx.variant.create({
                            data: {
                                productId: newProduct.id,
                                attributes: variant.attributes || {},
                                price: variant.price,
                                costPrice: variant.costPrice,
                                stockQuantity: 0,
                                lowStockThreshold: variant.lowStockThreshold,
                                createdAt: creationDate
                            }
                        }))
                    );

                    const initialStockMovements = [];
                    for (let i = 0; i < inputVariants.length; i++) {
                        if (inputVariants[i].initialStockQuantity && inputVariants[i].initialStockQuantity > 0) {
                            initialStockMovements.push({
                                variantId: createdVariants[i].id,
                                changeQuantity: inputVariants[i].initialStockQuantity,
                                type: 'INITIAL_STOCK',
                                reason: 'Product Creation Initial Stock',
                                timestamp: creationDate
                            });
                            await tx.variant.update({
                                where: { id: createdVariants[i].id },
                                data: { stockQuantity: inputVariants[i].initialStockQuantity }
                            });
                        }
                    }
                    if (initialStockMovements.length > 0) {
                        await tx.stockMovement.createMany({ data: initialStockMovements });
                    }
                }

                if (inputImages && inputImages.length > 0) {
                    await tx.productImage.createMany({
                        data: inputImages.map(img => ({
                            productId: newProduct.id,
                            imageUrl: img.imageUrl,
                            altText: img.altText,
                            isPrimary: img.isPrimary || false,
                            order: img.order,
                            createdAt: creationDate
                        }))
                    });
                }
            }
        });

        if (createdProductSummaries.length > 0) {
            for (const summary of createdProductSummaries) {
                const kafkaPayload = await fetchAndFormatProductForKafka(summary.id);
                if (kafkaPayload) { await sendMessage('PRODUCT_CREATED', kafkaPayload, summary.id); }
            }
        }
        res.status(201).json({ message: `Successfully created ${createdProductSummaries.length} products.`, createdProducts: createdProductSummaries });
    } catch (err) {
        if (err.statusCode && err.message) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        next(err);
    }
};


const createProduct = async (req, res, next) => {
    try {
        const { sku, name, description, isActive, variants: inputVariants, categoryIds, images: inputImages } = req.body;
        if (!sku || !name) return res.status(400).json({ message: 'SKU and Name are required' });
        const newProduct = await prisma.$transaction(async (tx) => {
            await validateLeafCategories(tx, categoryIds);
            const product = await tx.product.create({ data: { sku, name, description, isActive } });
            if (inputVariants && inputVariants.length > 0) {
                const createdVariants = await Promise.all(inputVariants.map(variant => tx.variant.create({ data: { productId: product.id, attributes: variant.attributes || {}, price: variant.price, costPrice: variant.costPrice, stockQuantity: 0, lowStockThreshold: variant.lowStockThreshold } })));
                const initialStockMovements = [];
                for (let i = 0; i < inputVariants.length; i++) {
                    if (inputVariants[i].initialStockQuantity && inputVariants[i].initialStockQuantity > 0) {
                        initialStockMovements.push({ variantId: createdVariants[i].id, changeQuantity: inputVariants[i].initialStockQuantity, type: 'INITIAL_STOCK', reason: 'Product Creation Initial Stock' });
                        await tx.variant.update({ where: { id: createdVariants[i].id }, data: { stockQuantity: inputVariants[i].initialStockQuantity } });
                    }
                }
                if (initialStockMovements.length > 0) {
                    await tx.stockMovement.createMany({ data: initialStockMovements });
                }
            }
            if (categoryIds && categoryIds.length > 0) {
                await tx.productCategory.createMany({ data: categoryIds.map(catId => ({ productId: product.id, categoryId: catId })), skipDuplicates: true });
            }
            if (inputImages && inputImages.length > 0) {
                await tx.productImage.createMany({ data: inputImages.map(img => ({ productId: product.id, imageUrl: img.imageUrl, altText: img.altText, isPrimary: img.isPrimary || false, order: img.order })) });
            }
            return product;
        });
        const kafkaPayload = await fetchAndFormatProductForKafka(newProduct.id);
        if (kafkaPayload) {
            await sendMessage('PRODUCT_CREATED', kafkaPayload, newProduct.id);
        }
        const fullProductResponse = await prisma.product.findUnique({ where: { id: newProduct.id }, include: { variants: true, categories: { include: { category: true } }, images: true } });
        if (!fullProductResponse) {
            return res.status(404).json({ message: 'Product created but could not be retrieved.' });
        }
        res.status(201).json(fullProductResponse);
    } catch (err) {
        if (err.statusCode) { return res.status(err.statusCode).json({ message: err.message }); }
        if (err.code === 'P2002') { return res.status(409).json({ message: `A product with SKU '${req.body.sku}' already exists.` }); }
        next(err);
    }
};

const getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { categorySlug, sortBy = 'createdAt', sortOrder = 'desc', isActive, q, minPrice, maxPrice, inStock, attributes } = req.query;

        const where = { AND: [] };

        if (q) {
            where.AND.push({
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { sku: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } }
                ]
            });
        }

        if (categorySlug) {
            where.AND.push({ categories: { some: { category: { slug: categorySlug } } } });
        }

        if (isActive !== undefined) {
            where.AND.push({ isActive: isActive === 'true' });
        }

        const priceFilter = {};
        if (minPrice) priceFilter.gte = parseFloat(minPrice);
        if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
        if (Object.keys(priceFilter).length > 0) {
            where.AND.push({ variants: { some: { price: priceFilter } } });
        }

        if (inStock === 'true') {
            where.AND.push({ variants: { some: { stockQuantity: { gt: 0 } } } });
        }

        if (attributes && typeof attributes === 'object') {
            Object.entries(attributes).forEach(([key, value]) => {
                const values = Array.isArray(value) ? value : [value];
                where.AND.push({
                    variants: {
                        some: {
                            attributes: {
                                path: [key],
                                in: values
                            }
                        }
                    }
                });
            });
        }

        if (where.AND.length === 0) {
            delete where.AND;
        }

        const orderBy = { [sortBy]: sortOrder };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    variants: true,
                    categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
                    images: { orderBy: { order: 'asc' } }
                }
            }),
            prisma.product.count({ where }),
        ]);

        res.json({
            data: products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
};

const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: { variants: true, categories: { include: { category: true } }, images: { orderBy: { order: 'asc' } }, }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        next(err);
    }
};

const getProductBySku = async (req, res, next) => {
    try {
        const { sku } = req.params;
        const product = await prisma.product.findUnique({
            where: { sku },
            include: { variants: true, categories: { include: { category: true } }, images: { orderBy: { order: 'asc' } }, }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        next(err);
    }
};

const updateProduct = async (req, res, next) => {
    let productId = req.params.id;
    try {
        const { sku, name, description, isActive } = req.body;
        const product = await prisma.product.update({
            where: { id: productId },
            data: { sku, name, description, isActive },
        });
        const kafkaPayload = await fetchAndFormatProductForKafka(productId);
        if (kafkaPayload) {
            await sendMessage('PRODUCT_UPDATED', kafkaPayload, productId);
        }
        res.json(product);
    } catch (err) {
        next(err);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({ where: { id } });
        await sendMessage('PRODUCT_DELETED', { id });
        res.status(204).end();
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Product not found' });
        }
        next(err);
    }
};

const addCategoriesToProduct = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { categoryIds } = req.body;
        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            return res.status(400).json({ message: 'categoryIds must be a non-empty array.' });
        }
        await prisma.$transaction(async (tx) => {
            const productExists = await tx.product.findUnique({ where: { id }, select: { id: true } });
            if (!productExists) {
                throw { statusCode: 404, message: 'Product not found' };
            }
            await validateLeafCategories(tx, categoryIds);
            await tx.productCategory.createMany({
                data: categoryIds.map(catId => ({ productId: id, categoryId: catId })),
                skipDuplicates: true
            });
        });
        const kafkaPayload = await fetchAndFormatProductForKafka(id);
        if (kafkaPayload) {
            await sendMessage('PRODUCT_UPDATED', kafkaPayload, id);
        }
        res.status(201).json({ message: `Added categories to product ${id}.` });
    } catch (err) {
        if (err.statusCode) { return res.status(err.statusCode).json({ message: err.message }); }
        if (err.code === 'P2003') { return res.status(404).json({ message: 'One or more category IDs do not exist.' }); }
        next(err);
    }
};

const removeCategoriesFromProduct = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { categoryIds } = req.body;
        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            return res.status(400).json({ message: 'categoryIds must be a non-empty array.' });
        }
        const result = await prisma.productCategory.deleteMany({
            where: { productId: id, categoryId: { in: categoryIds } }
        });
        if (result.count > 0) {
            const kafkaPayload = await fetchAndFormatProductForKafka(id);
            if (kafkaPayload) {
                await sendMessage('PRODUCT_UPDATED', kafkaPayload, id);
            }
        }
        res.status(200).json({ message: `Removed ${result.count} categories from product ${id}.` });
    } catch (err) {
        next(err);
    }
};

const addImagesToProduct = async (req, res, next) => {
    const { id } = req.params;
    try {
        const images = req.body;
        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ message: 'Request body must be a non-empty array of image objects.' });
        }
        let imageAdded = false;
        await prisma.$transaction(async (tx) => {
            const productExists = await tx.product.findUnique({ where: { id }, select: { id: true } });
            if (!productExists) {
                throw { statusCode: 404, message: 'Product not found' };
            }
            const primaryImage = images.find(img => img.isPrimary === true);
            if (primaryImage) {
                await tx.productImage.updateMany({ where: { productId: id, isPrimary: true }, data: { isPrimary: false } });
            }
            const imageData = images.map(img => ({ productId: id, imageUrl: img.imageUrl, altText: img.altText, isPrimary: img.isPrimary || false, order: img.order }));
            const result = await tx.productImage.createMany({ data: imageData });
            imageAdded = result.count > 0;
        });
        if (imageAdded) {
            const kafkaPayload = await fetchAndFormatProductForKafka(id);
            if (kafkaPayload) {
                await sendMessage('PRODUCT_UPDATED', kafkaPayload, id);
            }
        }
        res.status(201).json({ message: `Added images to product ${id}.` });
    } catch (err) {
        if (err.statusCode) { return res.status(err.statusCode).json({ message: err.message }); }
        next(err);
    }
};

const removeImagesFromProduct = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { imageIds } = req.body;
        if (!Array.isArray(imageIds) || imageIds.length === 0) {
            return res.status(400).json({ message: 'imageIds must be a non-empty array.' });
        }
        const result = await prisma.productImage.deleteMany({
            where: { productId: id, id: { in: imageIds } }
        });
        if (result.count > 0) {
            const kafkaPayload = await fetchAndFormatProductForKafka(id);
            if (kafkaPayload) {
                await sendMessage('PRODUCT_UPDATED', kafkaPayload, id);
            }
        }
        res.status(200).json({ message: `Removed ${result.count} images from product ${id}.` });
    } catch (err) {
        next(err);
    }
};

const resyncAllProducts = async (req, res, next) => {
    try {
        console.log("Starting product re-sync process...");
        const allProducts = await prisma.product.findMany({ select: { id: true } });

        if (!allProducts || allProducts.length === 0) {
            return res.status(200).json({ message: 'No products found to re-sync.', broadcasted: 0 });
        }

        let successCount = 0;
        for (const p of allProducts) {
            const kafkaPayload = await fetchAndFormatProductForKafka(p.id);
            if (kafkaPayload) {
                await sendMessage('PRODUCT_UPDATED', kafkaPayload, p.id);
                successCount++;
            }
        }

        console.log(`Successfully broadcasted ${successCount} product events to Kafka.`);
        res.status(200).json({
            message: 'Product re-sync completed successfully.',
            broadcasted: successCount,
        });
    } catch (err) {
        console.error("Error during product re-sync:", err);
        next(err);
    }
};

module.exports = {
    createManyProducts,
    createProduct,
    getProducts,
    getProductById,
    getProductBySku,
    updateProduct,
    deleteProduct,
    addCategoriesToProduct,
    removeCategoriesFromProduct,
    addImagesToProduct,
    removeImagesFromProduct,
    fetchAndFormatProductForKafka,
    resyncAllProducts
};