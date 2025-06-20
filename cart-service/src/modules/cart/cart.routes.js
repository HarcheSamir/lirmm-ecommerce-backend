const express = require('express');
const {
    getOrCreateCart,
    getCartById,
    addItemToCart,
    updateItemInCart,
    removeItemFromCart,
    clearCart,
    deleteCart,
    associateCartWithUser // <-- IMPORT NEW CONTROLLER
} = require('./cart.controller');

const router = express.Router();

// Route to associate a guest cart with a newly logged-in user
router.post('/associate', associateCartWithUser); // <-- ADD NEW ROUTE

// Existing Routes...
router.post('/', getOrCreateCart);
router.get('/:cartId', getCartById);
router.post('/:cartId/items', addItemToCart);
router.put('/:cartId/items/:itemId', updateItemInCart);
router.delete('/:cartId/items/:itemId', removeItemFromCart);
router.delete('/:cartId/items', clearCart);
router.delete('/:cartId', deleteCart);

module.exports = router;