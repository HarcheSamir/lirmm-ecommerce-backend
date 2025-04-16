const prisma = require('../../config/prisma');
const { sendMessage } = require('../../kafka/producer');

// Helper function for building category tree (if needed frequently)
const buildTree = (categories, parentId = null) => {
    const tree = [];
    categories
        .filter(category => category.parentId === parentId)
        .forEach(category => {
            const children = buildTree(categories, category.id);
            if (children.length) {
                category.children = children;
            }
            tree.push(category);
        });
    return tree;
};

// Create a new category
const createCategory = async (req, res, next) => {
    try {
        const { name, slug, parentId, isLeaf, imageUrl } = req.body;

        // Basic validation
        if (!name || !slug) {
            return res.status(400).json({ message: 'Name and slug are required' });
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                parentId,
                isLeaf,
                imageUrl,
            },
        });

        await sendMessage('CATEGORY_CREATED', category);
        res.status(201).json(category);
    } catch (err) {
        next(err); // Pass error to global handler
    }
};

// Get all categories (flat list or tree)
const getCategories = async (req, res, next) => {
    try {
        const { format } = req.query; // e.g., ?format=tree
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            // include: { children: format === 'tree' } // Basic tree, might need recursive fetch
        });

        if (format === 'tree') {
            const categoryTree = buildTree(categories);
             res.json(categoryTree);
        } else {
            res.json(categories); // Default flat list
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
            include: {
                parent: true, // Include parent category info
                children: true, // Include immediate children
            }
        });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
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
             include: {
                 parent: true,
                 children: true,
             }
        });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (err) {
        next(err);
    }
};

// Update a category
const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, parentId, isLeaf, imageUrl } = req.body;

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                slug,
                parentId,
                isLeaf,
                imageUrl,
                // updatedAt is handled automatically
            },
        });

        await sendMessage('CATEGORY_UPDATED', category);
        res.json(category);
    } catch (err) {
        // Prisma's P2025 error for record not found is handled by global handler
        next(err);
    }
};

// Delete a category
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Important: Check for children or associated products if deletion shouldn't cascade freely
        // Depending on DB constraints (onDelete: NoAction/Restrict), this might fail anyway
        const childrenCount = await prisma.category.count({ where: { parentId: id } });
        const productCount = await prisma.productCategory.count({ where: { categoryId: id } });

        if (childrenCount > 0) {
             return res.status(400).json({ message: 'Cannot delete category with children. Reassign children first.' });
        }
         if (productCount > 0) {
             return res.status(400).json({ message: 'Cannot delete category with associated products. Disassociate products first.' });
         }


        const deletedCategory = await prisma.category.delete({
            where: { id },
        });

        await sendMessage('CATEGORY_DELETED', { id }); // Send only ID for delete events
        res.status(204).end();
    } catch (err) {
        // P2025 handled globally. Handle others if needed.
         if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
             // Foreign key constraint failed (e.g., trying to delete parent with NoAction)
            return res.status(409).json({ message: 'Cannot delete category due to existing relationships (e.g., children or products).', code: err.code });
        }
        next(err);
    }
};


module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
};