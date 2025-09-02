const prisma = require('../../config/prisma');
const { sendMessage } = require('../../kafka/producer');

const getLanguage = (req) => {
    const langHeader = req.headers['accept-language']?.split(',')[0] || 'en';
    return langHeader.substring(0, 2);
};

const localizeObject = (obj, lang, fields) => {
    if (!obj) return obj;
    const localized = { ...obj };
    for (const field of fields) {
        if (localized[field] && typeof localized[field] === 'object' && localized[field] !== null) {
            localized[field] = localized[field][lang] || localized[field]['en'];
        }
    }
    return localized;
};

const buildTree = (categories, parentId = null, lang) => {
    return categories
        .filter(category => category.parentId === parentId)
        .map(category => {
            const children = buildTree(categories, category.id, lang);
            const node = { ...category };
            
            node.name = node.name[lang] || node.name['en'];
            node.isLeaf = children.length === 0;
            if (children.length > 0) {
                node.children = children;
            }
            delete node._count;
            return node;
        });
};

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
                if (!parentCategory) { throw { statusCode: 404, message: `Parent category with id '${parentId}' not found.` }; }
                if (parentCategory.parentId) { throw { statusCode: 400, message: 'Cannot create a category under a level 2 category. Hierarchy is limited to 2 levels.' }; }
                if (parentCategory._count.products > 0) { throw { statusCode: 409, message: 'Cannot add a child to a category that has products assigned to it.' }; }
            }
            return tx.category.create({ data: { name, slug, parentId, imageUrl } });
        });

        await sendMessage('CATEGORY_CREATED', newCategory);
        res.status(201).json({ ...newCategory, isLeaf: true, productCount: 0, subCategoryCount: 0 });
    } catch (err) {
        if (err.statusCode) { return res.status(err.statusCode).json({ message: err.message }); }
        if (err.code === 'P2002' && err.meta?.target.includes('slug')) {
             return res.status(409).json({ message: `A category with the slug '${req.body.slug}' already exists.` });
        }
        next(err);
    }
};

const getCategories = async (req, res, next) => {
    try {
        const { format } = req.query;
        const lang = getLanguage(req);

        // CORRECTED: Fetch without sorting by JSON path
        const categories = await prisma.category.findMany({
            include: { _count: { select: { children: true, products: true } } },
        });
        
        // CORRECTED: Perform sorting in-memory after fetching
        categories.sort((a, b) => {
            const nameA = a.name[lang] || a.name['en'] || '';
            const nameB = b.name[lang] || b.name['en'] || '';
            return nameA.localeCompare(nameB);
        });

        const categoriesWithCounts = categories.map(c => ({
            ...c,
            isLeaf: c._count.children === 0,
            productCount: c._count.products,
            subCategoryCount: c._count.children
        }));

        if (format === 'tree') {
            const categoryTree = buildTree(categoriesWithCounts, null, lang);
            res.json(categoryTree);
        } else {
            const flatList = categoriesWithCounts.map(c => {
                const localized = localizeObject(c, lang, ['name']);
                delete localized._count;
                return localized;
            });
            res.json(flatList);
        }
    } catch (err) {
        next(err);
    }
};

const getCategoryByIdOrSlug = async (req, res, next) => {
    try {
        const { id, slug } = req.params;
        const lang = getLanguage(req);
        const where = id ? { id } : { slug };

        const category = await prisma.category.findUnique({
            where,
            include: { parent: true, children: true, _count: { select: { children: true, products: true } } }
        });

        if (!category) { return res.status(404).json({ message: 'Category not found' }); }

        const localizedCategory = localizeObject(category, lang, ['name']);
        if (localizedCategory.parent) {
            localizedCategory.parent = localizeObject(localizedCategory.parent, lang, ['name']);
        }
        if (localizedCategory.children) {
            localizedCategory.children = localizedCategory.children.map(child => localizeObject(child, lang, ['name']));
        }

        const response = {
            ...localizedCategory,
            isLeaf: category._count.children === 0,
            productCount: category._count.products,
            subCategoryCount: category._count.children
        };
        delete response._count;
        res.json(response);
    } catch (err) {
        next(err);
    }
};

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

const createManyCategories = async (req, res, next) => {
    try {
        const categoriesData = require('../../utils/seed').categories;
        if (!Array.isArray(categoriesData) || categoriesData.length === 0) {
            return res.status(400).json({ message: 'Category data must be a non-empty array.' });
        }

        for (const c of categoriesData) {
            if (!c.name || typeof c.name !== 'object' || !c.slug) {
                throw { statusCode: 400, message: `All categories must have a slug and a multilingual name object.` };
            }
        }

        let createdCategories = [];
        await prisma.$transaction(async (tx) => {
            const parentMap = new Map();
            for (const categoryData of categoriesData.filter(c => !c.parentSlug)) {
                const newCategory = await tx.category.create({
                    data: { name: categoryData.name, slug: categoryData.slug, imageUrl: categoryData.imageUrl },
                });
                createdCategories.push(newCategory);
                parentMap.set(newCategory.slug, newCategory.id);
            }
            for (const categoryData of categoriesData.filter(c => c.parentSlug)) {
                const parentId = parentMap.get(categoryData.parentSlug);
                if (!parentId) {
                    throw { statusCode: 400, message: `Parent slug '${categoryData.parentSlug}' for category '${categoryData.slug}' not found in this batch.` };
                }
                const newCategory = await tx.category.create({
                    data: { name: categoryData.name, slug: categoryData.slug, parentId: parentId, imageUrl: categoryData.imageUrl },
                });
                createdCategories.push(newCategory);
            }
        });
        
        for (const category of createdCategories) {
            await sendMessage('CATEGORY_CREATED', category);
        }

        res.status(201).json({
            message: `Successfully created ${createdCategories.length} categories.`,
            createdCategories: createdCategories
        });

    } catch (err) {
        if (err.statusCode) { return res.status(err.statusCode).json({ message: err.message }); }
        if (err.code === 'P2002') { return res.status(409).json({ message: 'A category in the batch has a slug that already exists.'}); }
        next(err);
    }
};

module.exports = {
    createManyCategories,
    createCategory,
    getCategories,
    getCategoryById: getCategoryByIdOrSlug,
    getCategoryBySlug: getCategoryByIdOrSlug,
    updateCategory,
    deleteCategory,
};