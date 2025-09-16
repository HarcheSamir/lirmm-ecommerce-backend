const express = require('express');
const {
    getOrCreateCart,
    getCartById,
    addItemToCart,
    updateItemInCart,
    removeItemFromCart,
    clearCart,
    deleteCart,
    associateCartWithUser 
} = require('./cart.controller');

const router = express.Router();

router.post('/associate', associateCartWithUser); 
router.post('/', getOrCreateCart);
router.get('/:cartId', getCartById);
router.post('/:cartId/items', addItemToCart);
router.put('/:cartId/items/:itemId', updateItemInCart);
router.delete('/:cartId/items/:itemId', removeItemFromCart);
router.delete('/:cartId/items', clearCart);
router.delete('/:cartId', deleteCart);

module.exports = router;