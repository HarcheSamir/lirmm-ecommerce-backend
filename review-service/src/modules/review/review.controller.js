const prisma = require('../../config/prisma');
const { sendMessage } = require('../../kafka/producer');
const axios = require('axios');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL;
if (!ORDER_SERVICE_URL) {
    console.error('FATAL: ORDER_SERVICE_URL environment variable is not defined.');
    process.exit(1);
}

const reviewInclude = {
    user: { select: { id: true, name: true, profileImage: true } },
    product: { select: { id: true, name: true, sku: true, imageUrl: true } }
};

const calculateStatsAndPublish = async (productId) => {
    const stats = await prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { _all: true },
    });

    const payload = {
        productId,
        averageRating: stats._avg.rating || 0,
        reviewCount: stats._count._all || 0,
    };

    await sendMessage('REVIEW_UPDATED', payload);
    return payload;
};

const createReview = async (req, res, next) => {
    try {
        const { productId, rating, title, comment } = req.body;
        const userId = req.user.id;

        if (!productId || !rating || !comment) {
            return res.status(400).json({ message: 'productId, rating, and comment are required.' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        }

        const [existingReview, product, user] = await prisma.$transaction([
            prisma.review.findUnique({ where: { userId_productId: { userId, productId } } }),
            prisma.denormalizedProduct.findUnique({ where: { id: productId } }),
            prisma.denormalizedUser.findUnique({ where: { id: userId } })
        ]);

        if (existingReview) return res.status(409).json({ message: 'You have already reviewed this product.' });
        if (!product) return res.status(404).json({ message: 'Product not found.' });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        let isVerified = false;
        try {
            const url = `${ORDER_SERVICE_URL}/internal/verify-purchase?userId=${userId}&productId=${productId}`;
            const response = await axios.get(url, { timeout: 3000 });
            isVerified = response.data.verified === true;
        } catch (error) {
            console.warn(`Could not verify purchase with order-service: ${error.message}`);
        }

        const newReview = await prisma.review.create({
            data: { rating, title, comment, userId, productId, isVerifiedPurchase: isVerified },
            include: reviewInclude,
        });

        await calculateStatsAndPublish(productId);
        res.status(201).json(newReview);
    } catch (err) {
        next(err);
    }
};

const updateReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const { rating, title, comment } = req.body;
        const userId = req.user.id;

        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) return res.status(404).json({ message: 'Review not found.' });
        if (review.userId !== userId) return res.status(403).json({ message: 'Forbidden: You can only update your own reviews.' });

        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: { rating, title, comment },
            include: reviewInclude,
        });

        await calculateStatsAndPublish(review.productId);
        res.status(200).json(updatedReview);
    } catch (err) {
        next(err);
    }
};

const deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const user = req.user;

        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) return res.status(404).json({ message: 'Review not found.' });

        const isOwner = review.userId === user.id;
        const isAdmin = user.permissions.includes('delete:review');
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this review.' });
        }

        await prisma.review.delete({ where: { id: reviewId } });
        await calculateStatsAndPublish(review.productId);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

const getReviewsByProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const where = { productId };
        const [reviews, total] = await prisma.$transaction([
            prisma.review.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: reviewInclude }),
            prisma.review.count({ where })
        ]);

        res.json({
            data: reviews,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        next(err);
    }
};

const getMyReviews = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const where = { userId };
        const [reviews, total] = await prisma.$transaction([
            prisma.review.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: reviewInclude }),
            prisma.review.count({ where })
        ]);

        res.json({
            data: reviews,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        next(err);
    }
};

const getAllReviews = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { userId, productId, rating } = req.query;

        const where = {};
        if (userId) {
            where.userId = userId;
        }
        if (productId) {
            where.productId = productId;
        }
        if (rating) {
            const ratingInt = parseInt(rating, 10);
            if (!isNaN(ratingInt) && ratingInt >= 1 && ratingInt <= 5) {
                where.rating = ratingInt;
            }
        }

        const [reviews, total] = await prisma.$transaction([
            prisma.review.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: reviewInclude
            }),
            prisma.review.count({ where })
        ]);

        res.json({
            data: reviews,
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

module.exports = {
    createReview,
    updateReview,
    deleteReview,
    getReviewsByProduct,
    getMyReviews,
    getAllReviews
};