// product-service/src/modules/promotion/promotion.controller.js
const prisma = require('../../config/prisma');

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

const createPromotion = async (req, res, next) => {
    try {
        const { title, subtitle, tagline, ctaText, ctaLink, imageUrl, productImageUrl, expiresAt, isActive, displayOrder } = req.body;
        if (!title || !ctaText || !ctaLink || !imageUrl) {
            return res.status(400).json({ message: 'title, ctaText, ctaLink, and imageUrl are required.' });
        }
        const newPromotion = await prisma.promotion.create({
            data: {
                title, subtitle, tagline, ctaText, ctaLink, imageUrl, productImageUrl,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                isActive, displayOrder
            }
        });
        res.status(201).json(newPromotion);
    } catch (err) {
        next(err);
    }
};

const getActivePromotions = async (req, res, next) => {
    try {
        const lang = getLanguage(req);
        const promotions = await prisma.promotion.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
        });

        const localizedPromotions = promotions.map(p =>
            localizeObject(p, lang, ['title', 'subtitle', 'tagline', 'ctaText'])
        );

        res.json(localizedPromotions);
    } catch (err) {
        next(err);
    }
};

const getAllPromotionsAdmin = async (req, res, next) => {
    try {
        const promotions = await prisma.promotion.findMany({
            orderBy: { displayOrder: 'asc' }
        });
        res.json(promotions);
    } catch (err) {
        next(err);
    }
};

const getPromotionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const promotion = await prisma.promotion.findUnique({ where: { id } });
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found.' });
        }
        res.json(promotion);
    } catch (err) {
        next(err);
    }
};

const updatePromotion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, subtitle, tagline, ctaText, ctaLink, imageUrl, productImageUrl, expiresAt, isActive, displayOrder } = req.body;
        const updatedPromotion = await prisma.promotion.update({
            where: { id },
            data: {
                title, subtitle, tagline, ctaText, ctaLink, imageUrl, productImageUrl,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                isActive, displayOrder
            }
        });
        res.json(updatedPromotion);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Promotion not found.' });
        }
        next(err);
    }
};

const deletePromotion = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.promotion.delete({ where: { id } });
        res.status(204).end();
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Promotion not found.' });
        }
        next(err);
    }
};

// --- START: SURGICAL ADDITION ---
const reorderPromotions = async (req, res, next) => {
    try {
        const { orderedIds } = req.body;
        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ message: 'orderedIds must be an array.' });
        }

        const updates = orderedIds.map((id, index) =>
            prisma.promotion.update({
                where: { id },
                data: { displayOrder: index },
            })
        );

        await prisma.$transaction(updates);

        res.status(200).json({ message: 'Promotions reordered successfully.' });
    } catch (err) {
        next(err);
    }
};
// --- END: SURGICAL ADDITION ---


module.exports = {
    createPromotion,
    getActivePromotions,
    getAllPromotionsAdmin,
    getPromotionById,
    updatePromotion,
    deletePromotion,
    reorderPromotions // --- START: SURGICAL ADDITION ---
};