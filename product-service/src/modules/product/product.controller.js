// product-service/src/modules/product/product.controller.js

const prisma = require('../../config/prisma');
const { sendMessage } = require('../../kafka/producer');

// --- Helper Function to Fetch and Format Product for Kafka/Search ---
const fetchAndFormatProductForKafka = async (productId) => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            categories: { select: { category: { select: { name: true, slug: true } } } },
            variants: { select: { attributes: true, price: true, stockQuantity: true, id: true } },
            images: { select: { imageUrl: true, altText: true, isPrimary: true }, orderBy: { order: 'asc' } }
        }
    });

    if (!product) {
        console.warn(`[Kafka Helper] Product ${productId} not found when formatting for Kafka.`);
        return null;
    }

    const kafkaPayload = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        category_names: product.categories.map(pc => pc.category.name),
        category_slugs: product.categories.map(pc => pc.category.slug),
        variants: product.variants.map(v => ({
            id: v.id,
            attributes: v.attributes,
            price: v.price,
            stockQuantity: v.stockQuantity
        })),
        variant_attributes_flat: product.variants
            .flatMap(v => Object.entries(v.attributes || {}).map(([key, value]) => `${key}:${value}`))
            .filter((v, i, a) => a.indexOf(v) === i),
        primaryImageUrl: product.images.find(img => img.isPrimary)?.imageUrl || product.images[0]?.imageUrl || null,
    };

    return kafkaPayload;
};
// --- End Helper Function ---


// Create a new product
const createProduct = async (req, res, next) => {
    try {
        const {
            sku, name, description, isActive,
            variants: inputVariants, // Renamed to avoid conflict
            categoryIds,
            images: inputImages // Renamed
        } = req.body;

        if (!sku || !name) {
            return res.status(400).json({ message: 'SKU and Name are required' });
        }

        let createdProductId = null;

        const productData = await prisma.$transaction(async (tx) => {
            const newProduct = await tx.product.create({
                data: { sku, name, description, isActive },
            });
            createdProductId = newProduct.id;

            if (inputVariants && inputVariants.length > 0) {
                const createdVariants = await Promise.all(inputVariants.map(variant => tx.variant.create({
                    data: {
                        productId: newProduct.id, attributes: variant.attributes || {}, price: variant.price,
                        costPrice: variant.costPrice, stockQuantity: 0, lowStockThreshold: variant.lowStockThreshold
                    }
                })));
                const initialStockMovements = [];
                for (let i = 0; i < inputVariants.length; i++) {
                    if (inputVariants[i].initialStockQuantity && inputVariants[i].initialStockQuantity > 0) {
                        initialStockMovements.push({
                            variantId: createdVariants[i].id, changeQuantity: inputVariants[i].initialStockQuantity,
                            type: 'INITIAL_STOCK', reason: 'Product Creation Initial Stock'
                        });
                        await tx.variant.update({ where: { id: createdVariants[i].id }, data: { stockQuantity: inputVariants[i].initialStockQuantity } });
                    }
                }
                if (initialStockMovements.length > 0) { await tx.stockMovement.createMany({ data: initialStockMovements }); }
            }
            if (categoryIds && categoryIds.length > 0) {
                await tx.productCategory.createMany({ data: categoryIds.map(catId => ({ productId: newProduct.id, categoryId: catId })), skipDuplicates: true });
            }
            if (inputImages && inputImages.length > 0) {
                await tx.productImage.createMany({
                    data: inputImages.map(img => ({
                        productId: newProduct.id, imageUrl: img.imageUrl, altText: img.altText,
                        isPrimary: img.isPrimary || false, order: img.order
                    }))
                });
            }
            return { id: newProduct.id };
        });

        if (createdProductId) {
            const kafkaPayload = await fetchAndFormatProductForKafka(createdProductId);
            if (kafkaPayload) { await sendMessage('PRODUCT_CREATED', kafkaPayload, createdProductId); }
        }

        const fullProductResponse = await prisma.product.findUnique({
            where: { id: createdProductId },
            include: { variants: true, categories: { include: { category: true } }, images: true }
        });
        res.status(201).json(fullProductResponse);
    } catch (err) {
        next(err);
    }
};

// *** RESTORED FUNCTION ***
// Get products with pagination and filtering/sorting
const getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { categorySlug, sortBy = 'createdAt', sortOrder = 'desc', isActive } = req.query;

        const where = {};
        if (categorySlug) {
            where.categories = {
                some: {
                    category: { slug: categorySlug }
                }
            };
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const orderBy = { [sortBy]: sortOrder };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    variants: {
                         select: { id: true, attributes: true, price: true, stockQuantity: true }
                    },
                    categories: {
                         select: { category: { select: { id: true, name: true, slug: true } } }
                    },
                    images: {
                         where: { isPrimary: true },
                         take: 1
                    }
                },
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
// *** END RESTORED FUNCTION ***

// Get a single product by ID
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                variants: { include: { /* stockMovements */ } },
                categories: { include: { category: true } },
                images: { orderBy: { order: 'asc' } },
            }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        next(err);
    }
};

// Get a single product by SKU
const getProductBySku = async (req, res, next) => {
    try {
        const { sku } = req.params;
        const product = await prisma.product.findUnique({
            where: { sku },
            include: {
                variants: { include: { /* stockMovements */ } },
                categories: { include: { category: true } },
                images: { orderBy: { order: 'asc' } },
            }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        next(err);
    }
};

// Update a product (core details only)
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { sku, name, description, isActive } = req.body;

        const product = await prisma.product.update({
            where: { id },
            data: { sku, name, description, isActive },
        });

        const kafkaPayload = await fetchAndFormatProductForKafka(id);
        if (kafkaPayload) { await sendMessage('PRODUCT_UPDATED', kafkaPayload, id); }

        res.json(product);
    } catch (err) {
        next(err);
    }
};

// Delete a product
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existingProduct = await prisma.product.findUnique({ where: { id: id }, select: { id: true } });
        if (!existingProduct) { return res.status(404).json({ message: 'Product not found' }); }

        await prisma.product.delete({ where: { id } });

        await sendMessage('PRODUCT_DELETED', { id });
        res.status(204).end();
    } catch (err) {
        next(err);
    }
};


// Add categories to a product
const addCategoriesToProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { categoryIds } = req.body;
        if (!Array.isArray(categoryIds) || categoryIds.length === 0) { return res.status(400).json({ message: 'categoryIds must be a non-empty array.' }); }
        const productExists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
        if (!productExists) return res.status(404).json({ message: 'Product not found' });

        const result = await prisma.productCategory.createMany({ data: categoryIds.map(catId => ({ productId: id, categoryId: catId })), skipDuplicates: true });

        if (result.count > 0) {
            const kafkaPayload = await fetchAndFormatProductForKafka(id);
            if (kafkaPayload) { await sendMessage('PRODUCT_UPDATED', kafkaPayload, id); }
        }
        res.status(201).json({ message: `Added ${result.count} categories to product ${id}.` });
    } catch (err) {
        if (err instanceof prisma.PrismaClientKnownRequestError && err.code === 'P2003') { return res.status(400).json({ message: 'One or more category IDs are invalid.' }); }
        next(err);
    }
};

// Remove categories from a product
const removeCategoriesFromProduct = async (req, res, next) => {
     try {
        const { id } = req.params;
        const { categoryIds } = req.body;
        if (!Array.isArray(categoryIds) || categoryIds.length === 0) { return res.status(400).json({ message: 'categoryIds must be a non-empty array.' }); }

        const result = await prisma.productCategory.deleteMany({ where: { productId: id, categoryId: { in: categoryIds } } });

        if (result.count > 0) {
            const kafkaPayload = await fetchAndFormatProductForKafka(id);
            if (kafkaPayload) { await sendMessage('PRODUCT_UPDATED', kafkaPayload, id); }
        }
        res.status(200).json({ message: `Removed ${result.count} categories from product ${id}.` });
    } catch (err) {
        next(err);
    }
};


// Add images to a product
const addImagesToProduct = async (req, res, next) => {
     try {
        const { id } = req.params;
        const images = req.body;
        if (!Array.isArray(images) || images.length === 0) { return res.status(400).json({ message: 'Request body must be a non-empty array of image objects.' }); }
        const productExists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
        if (!productExists) return res.status(404).json({ message: 'Product not found' });

        const primaryImage = images.find(img => img.isPrimary === true);
        let imageAdded = false;
        await prisma.$transaction(async (tx) => {
             if (primaryImage) { await tx.productImage.updateMany({ where: { productId: id, isPrimary: true }, data: { isPrimary: false } }); }
            const imageData = images.map(img => ({ productId: id, imageUrl: img.imageUrl, altText: img.altText, isPrimary: img.isPrimary || false, order: img.order }));
            const result = await tx.productImage.createMany({ data: imageData });
            imageAdded = result.count > 0;
        });

        if (imageAdded) {
            const kafkaPayload = await fetchAndFormatProductForKafka(id);
            if (kafkaPayload) { await sendMessage('PRODUCT_UPDATED', kafkaPayload, id); }
        }
        res.status(201).json({ message: `Added images to product ${id}.` });
    } catch (err) {
        next(err);
    }
};

// Remove images from a product (by image IDs)
const removeImagesFromProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { imageIds } = req.body;
        if (!Array.isArray(imageIds) || imageIds.length === 0) { return res.status(400).json({ message: 'imageIds must be a non-empty array.' }); }

        const result = await prisma.productImage.deleteMany({ where: { productId: id, id: { in: imageIds } } });

        if (result.count > 0) {
             const kafkaPayload = await fetchAndFormatProductForKafka(id);
             if (kafkaPayload) { await sendMessage('PRODUCT_UPDATED', kafkaPayload, id); }
        }
        res.status(200).json({ message: `Removed ${result.count} images from product ${id}.` });
    } catch(err) {
        next(err);
    }
};


module.exports = {
    createProduct,
    getProducts, // Now defined above
    getProductById,
    getProductBySku,
    updateProduct,
    deleteProduct,
    addCategoriesToProduct,
    removeCategoriesFromProduct,
    addImagesToProduct,
    removeImagesFromProduct,
    // fetchAndFormatProductForKafka // Usually not exported
};