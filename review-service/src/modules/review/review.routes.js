const express = require('express');
const { createReview, updateReview, deleteReview, getReviewsByProduct, getMyReviews,
    getAllReviews } = require('./review.controller');
const authMiddleware = require('../../middlewares/auth');
const hasPermission = require('../../middlewares/permission');

const router = express.Router();

// Public route to get reviews for a product
router.get('/product/:productId', getReviewsByProduct);
router.get('/',
    //  authMiddleware, hasPermission('read:review-all'),
    getAllReviews);
// Protected routes
router.post('/', authMiddleware, hasPermission('write:review'), createReview);
router.get('/my-reviews', authMiddleware, hasPermission('read:review'), getMyReviews);
router.put('/:reviewId', authMiddleware, hasPermission('write:review'), updateReview);
router.delete('/:reviewId', authMiddleware, hasPermission('delete:review'), deleteReview);

module.exports = router;