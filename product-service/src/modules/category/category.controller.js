// product-service/src/modules/category/category.controller.js
// --- COMPLETE AND UNABRIDGED FILE ---

const prisma = require('../../config/prisma');
const { sendMessage } = require('../../kafka/producer');
const { categories } = require('../../utils/seed')

// Helper function to build category tree
const buildTree = (categories, parentId = null) => {
    return categories
        .filter(category => category.parentId === parentId)
        .map(category => {
            const children = buildTree(categories, category.id);
            const node = { ...category };
            // A node is a leaf if it has no children in the constructed tree.
            node.isLeaf = children.length === 0;
            if (children.length > 0) {
                node.children = children;
            }
            // Remove helper counts from the final output
            delete node._count;
            return node;
        });
};

// Create a new category
const createCategory = async (req, res, next) => {
    try {
        const { name, slug, parentId, imageUrl } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ message: 'Name and slug are required' });
        }

        const newCategory = await prisma.$transaction(async (tx) => {
            if (parentId) {
                const parentCategory = await tx.category.findUnique({
                    where: { id: parentId },
                    include: { _count: { select: { products: true } } },
                });

                if (!parentCategory) {
                    throw { statusCode: 404, message: `Parent category with id '${parentId}' not found.` };
                }
                if (parentCategory.parentId) {
                    throw { statusCode: 400, message: 'Cannot create a category under a level 2 category. Hierarchy is limited to 2 levels.' };
                }
                if (parentCategory._count.products > 0) {
                    throw { statusCode: 409, message: 'Cannot add a child to a category that has products assigned to it.' };
                }
            }

            const created = await tx.category.create({
                data: { name, slug, parentId, imageUrl },
            });
            return created;
        });

        await sendMessage('CATEGORY_CREATED', newCategory);
        // Add the new fields to the response for consistency
        res.status(201).json({
            ...newCategory,
            isLeaf: true,
            productCount: 0,
            subCategoryCount: 0
        });

    } catch (err) {
        if (err.statusCode) { return res.status(err.statusCode).json({ message: err.message }); }
        if (err.code === 'P2002' && err.meta?.target.includes('slug')) {
             return res.status(409).json({ message: `A category with the slug '${req.body.slug}' already exists.` });
        }
        next(err);
    }
};

// Create many categories
const createManyCategories = async (req, res, next) => {
    try {
        const categoriesData = categories;
        if (!Array.isArray(categoriesData) || categoriesData.length === 0) {
            return res.status(400).json({ message: 'Request body must be a non-empty array of category objects.' });
        }

        for (const c of categoriesData) {
            if (!c.name || !c.slug) {
                throw { statusCode: 400, message: `All categories must have a name and slug. Error found in: ${JSON.stringify(c)}` };
            }
        }

        let createdCategories = [];

        await prisma.$transaction(async (tx) => {
            const rootCategoriesData = categoriesData.filter(c => !c.parentSlug);
            const parentMap = new Map();

            for (const categoryData of rootCategoriesData) {
                const newCategory = await tx.category.create({
                    data: { name: categoryData.name, slug: categoryData.slug, imageUrl: categoryData.imageUrl, },
                });
                createdCategories.push(newCategory);
                parentMap.set(newCategory.slug, newCategory.id);
            }

            const childCategoriesData = categoriesData.filter(c => c.parentSlug);
            
            for (const categoryData of childCategoriesData) {
                let parentId = parentMap.get(categoryData.parentSlug);
                if (!parentId) {
                    const existingParent = await tx.category.findUnique({ where: { slug: categoryData.parentSlug }, select: { id: true } });
                    if (!existingParent) {
                        throw { statusCode: 400, message: `The specified parentSlug '${categoryData.parentSlug}' for category '${categoryData.name}' does not exist in the database or in this batch.` };
                    }
                    parentId = existingParent.id;
                    parentMap.set(categoryData.parentSlug, parentId);
                }
                
                const newCategory = await tx.category.create({
                    data: { name: categoryData.name, slug: categoryData.slug, parentId: parentId, imageUrl: categoryData.imageUrl, },
                });
                createdCategories.push(newCategory);
            }
        });

        const allCreated = await prisma.category.findMany({
            where: { id: { in: createdCategories.map(c => c.id) } },
            include: { _count: { select: { children: true, products: true } } }
        });

        const responseWithCounts = allCreated.map(c => ({
            ...c,
            isLeaf: c._count.children === 0,
            productCount: c._count.products,
            subCategoryCount: c._count.children
        }));

        for (const category of responseWithCounts) {
            await sendMessage('CATEGORY_CREATED', category);
        }

        res.status(201).json({
            message: `Successfully created ${createdCategories.length} categories.`,
            createdCategories: responseWithCounts.map(({_count, ...rest}) => rest)
        });

    } catch (err) {
        if (err.statusCode) { return res.status(err.statusCode).json({ message: err.message }); }
        if (err.code === 'P2002') { return res.status(409).json({ message: 'A category in the batch has a slug that already exists.' }); }
        next(err);
    }
};

// Get all categories (flat or tree)
const getCategories = async (req, res, next) => {
    try {
        const { format } = req.query;
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { children: true, products: true } },
            },
        });

        // Add the new fields to the response objects
        const categoriesWithCounts = categories.map(c => ({
            ...c,
            isLeaf: c._count.children === 0,
            productCount: c._count.products,
            subCategoryCount: c._count.children
        }));

        if (format === 'tree') {
            const categoryTree = buildTree(categoriesWithCounts);
            res.json(categoryTree);
        } else {
            // Remove the helper _count object before sending the final response
            const flatList = categoriesWithCounts.map(c => {
                const { _count, ...rest } = c;
                return rest;
            });
            res.json(flatList);
        }
    } catch (err) {
        next(err);
    }
};

// Get a single category by ID
const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({
            where: { id },
            // Add 'products' to the _count select
            include: { parent: true, children: true, _count: { select: { children: true, products: true } } }
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Add the new fields to the response object
        const response = {
            ...category,
            isLeaf: category._count.children === 0,
            productCount: category._count.products,
            subCategoryCount: category._count.children
        };
        delete response._count; // Clean up the helper object
        res.json(response);

    } catch (err) {
        next(err);
    }
};

// Get a single category by Slug
const getCategoryBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const category = await prisma.category.findUnique({
            where: { slug },
            // Add 'products' to the _count select
            include: { parent: true, children: true, _count: { select: { children: true, products: true } } }
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Add the new fields to the response object
        const response = {
            ...category,
            isLeaf: category._count.children === 0,
            productCount: category._count.products,
            subCategoryCount: category._count.children
        };
        delete response._count; // Clean up the helper object
        res.json(response);

    } catch (err) {
        next(err);
    }
};

// Update a category
const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, parentId = undefined, imageUrl } = req.body;

        const updatedCategory = await prisma.$transaction(async (tx) => {
            const categoryToUpdate = await tx.category.findUnique({
                where: { id },
                include: { _count: { select: { children: true, products: true } } }
            });

            if (!categoryToUpdate) { throw { statusCode: 404, message: 'Category not found.' }; }

            if (parentId !== undefined && categoryToUpdate.parentId !== parentId) {
                if (parentId !== null) {
                    if (parentId === id) { throw { statusCode: 400, message: "A category cannot be its own parent." }; }
                    const newParent = await tx.category.findUnique({ where: { id: parentId }, include: { _count: { select: { products: true } } } });
                    if (!newParent) { throw { statusCode: 404, message: `New parent category with id '${parentId}' not found.` }; }
                    if (newParent.parentId) { throw { statusCode: 400, message: "Cannot move category under a level 2 category." }; }
                    if (newParent._count.products > 0) { throw { statusCode: 409, message: "The new parent category cannot have products." }; }
                    if (categoryToUpdate._count.children > 0) { throw { statusCode: 409, message: "Cannot move a category that has children. Move its children first." }; }
                }
            }

            return tx.category.update({ where: { id }, data: { name, slug, parentId, imageUrl } });
        });

        await sendMessage('CATEGORY_UPDATED', updatedCategory);
        res.json(updatedCategory);

    } catch (err) {
        if (err.statusCode) { return res.status(err.statusCode).json({ message: err.message }); }
        if (err.code === 'P2002' && err.meta?.target.includes('slug')) {
             return res.status(409).json({ message: `A category with the slug '${req.body.slug}' already exists.` });
        }
        next(err);
    }
};

// Delete a category
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.$transaction(async (tx) => {
            const categoryToDelete = await tx.category.findUnique({
                where: { id },
                include: { _count: { select: { children: true, products: true } } },
            });
            if (!categoryToDelete) { return; }
            if (categoryToDelete._count.children > 0) { throw { statusCode: 409, message: 'Cannot delete category with children. Reassign or delete children first.' }; }
            if (categoryToDelete._count.products > 0) { throw { statusCode: 409, message: 'Cannot delete category with associated products. Disassociate products first.' }; }
            await tx.category.delete({ where: { id } });
        });

        await sendMessage('CATEGORY_DELETED', { id });
        res.status(204).end();
    } catch (err) {
        if (err.statusCode) { return res.status(err.statusCode).json({ message: err.message }); }
        next(err);
    }
};

// This export block remains unchanged and correct for your router.
module.exports = {
    createManyCategories,
    createCategory,
    getCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
};