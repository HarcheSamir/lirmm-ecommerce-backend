const { redisClient } = require('../../config/redis');
const { v4: uuidv4 } = require('uuid');

const CART_PREFIX = 'cart:';
const CART_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days for guest carts, can be configurable

// Helper function to create a custom error
const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const associateCartWithUser = async (req, res, next) => {
    try {
        const { cartId, userId } = req.body;
        if (!cartId || !userId) {
            return next(createError('cartId and userId are required for association.', 400));
        }

        const cartKey = `${CART_PREFIX}${cartId}`;
        const cartDataString = await redisClient.get(cartKey);

        if (!cartDataString) {
 
            return res.status(200).json({ message: 'Cart not found, no association needed.' });
        }

        const cart = JSON.parse(cartDataString);

        // Update the userId and refresh the timestamp
        cart.userId = userId;
        cart.updatedAt = new Date().toISOString();

        // Save the updated cart back to Redis, refreshing its TTL
        await redisClient.set(cartKey, JSON.stringify(cart), 'EX', CART_TTL_SECONDS);

        res.status(200).json(cart);

    } catch (error) {
        next(error);
    }
};

// Create or get a cart. If cartId is provided and exists, it's returned.
const getOrCreateCart = async (req, res, next) => {
    try {
        let cartId = req.params.cartId || req.query.cartId;
        const { userId } = req.body; // Optional: For associating cart with a user

        if (cartId) {
            const cartKey = `${CART_PREFIX}${cartId}`;
            const cartExists = await redisClient.exists(cartKey);
            if (cartExists) {
                const cartDataString = await redisClient.get(cartKey);
                const cart = JSON.parse(cartDataString);
                await redisClient.expire(cartKey, CART_TTL_SECONDS); // Refresh TTL
                return res.status(200).json(cart);
            }
        }

        const newCartId = cartId || uuidv4();
        const cartKey = `${CART_PREFIX}${newCartId}`;
        const newCart = {
            id: newCartId,
            userId: userId || null,
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await redisClient.set(cartKey, JSON.stringify(newCart), 'EX', CART_TTL_SECONDS);
        res.status(201).json(newCart);

    } catch (error) {
        next(error);
    }
};

const getCartById = async (req, res, next) => {
    try {
        const { cartId } = req.params;
        const cartKey = `${CART_PREFIX}${cartId}`;

        const cartDataString = await redisClient.get(cartKey);

        if (!cartDataString) {
            const newCart = {
                id: cartId,
                userId: req.body.userId || null,
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await redisClient.set(cartKey, JSON.stringify(newCart), 'EX', CART_TTL_SECONDS);
            return res.status(201).json(newCart);
        }

        const cart = JSON.parse(cartDataString);
        await redisClient.expire(cartKey, CART_TTL_SECONDS);
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
};

const addItemToCart = async (req, res, next) => {
    try {
        const { cartId } = req.params;
        const { productId, variantId, quantity, price, name, imageUrl, attributes } = req.body;

        if (!productId || !variantId || quantity === undefined || price === undefined) {
            return next(createError('productId, variantId, quantity, and price are required to add an item.', 400));
        }
        if (parseInt(quantity, 10) <= 0) {
            return next(createError('Quantity must be a positive integer.', 400));
        }

        const cartKey = `${CART_PREFIX}${cartId}`;
        const cartDataString = await redisClient.get(cartKey);

        let cart;
        if (!cartDataString) {
            cart = { id: cartId, userId: req.body.userId || null, items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        } else {
            cart = JSON.parse(cartDataString);
        }

        const existingItemIndex = cart.items.findIndex(
            item => item.productId === productId && item.variantId === variantId
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += parseInt(quantity, 10);
            cart.items[existingItemIndex].price = parseFloat(price);
            if (name) cart.items[existingItemIndex].name = name;
            if (imageUrl) cart.items[existingItemIndex].imageUrl = imageUrl;
            if (attributes) cart.items[existingItemIndex].attributes = attributes;
        } else {
            cart.items.push({
                itemId: uuidv4(),
                productId,
                variantId,
                quantity: parseInt(quantity, 10),
                price: parseFloat(price),
                name: name || 'Product Name Unavailable',
                imageUrl: imageUrl || null,
                attributes: attributes || {},
                addedAt: new Date().toISOString()
            });
        }

        cart.updatedAt = new Date().toISOString();
        await redisClient.set(cartKey, JSON.stringify(cart), 'EX', CART_TTL_SECONDS);
        res.status(200).json(cart);

    } catch (error) {
        next(error);
    }
};

const updateItemInCart = async (req, res, next) => {
    try {
        const { cartId, itemId } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined || parseInt(quantity, 10) <= 0) {
            return next(createError('New quantity must be a positive integer.', 400));
        }

        const cartKey = `${CART_PREFIX}${cartId}`;
        const cartDataString = await redisClient.get(cartKey);

        if (!cartDataString) {
            return next(createError('Cart not found.', 404));
        }

        const cart = JSON.parse(cartDataString);
        const itemIndex = cart.items.findIndex(item => item.itemId === itemId);

        if (itemIndex === -1) {
            return next(createError('Item not found in cart.', 404));
        }

        cart.items[itemIndex].quantity = parseInt(quantity, 10);
        cart.updatedAt = new Date().toISOString();

        await redisClient.set(cartKey, JSON.stringify(cart), 'EX', CART_TTL_SECONDS);
        res.status(200).json(cart);

    } catch (error) {
        next(error);
    }
};

const removeItemFromCart = async (req, res, next) => {
    try {
        const { cartId, itemId } = req.params;
        const cartKey = `${CART_PREFIX}${cartId}`;
        const cartDataString = await redisClient.get(cartKey);

        if (!cartDataString) {
            return next(createError('Cart not found.', 404));
        }

        const cart = JSON.parse(cartDataString);
        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item.itemId !== itemId);

        if (cart.items.length === initialLength) {
            return next(createError('Item not found in cart.', 404));
        }

        cart.updatedAt = new Date().toISOString();
        await redisClient.set(cartKey, JSON.stringify(cart), 'EX', CART_TTL_SECONDS);
        res.status(200).json(cart);

    } catch (error) {
        next(error);
    }
};

const clearCart = async (req, res, next) => {
    try {
        const { cartId } = req.params;
        const cartKey = `${CART_PREFIX}${cartId}`;
        const cartDataString = await redisClient.get(cartKey);

        if (!cartDataString) {
            return next(createError('Cart not found.', 404));
        }

        const cart = JSON.parse(cartDataString);
        cart.items = [];
        cart.updatedAt = new Date().toISOString();

        await redisClient.set(cartKey, JSON.stringify(cart), 'EX', CART_TTL_SECONDS);
        res.status(200).json(cart);

    } catch (error) {
        next(error);
    }
};

const deleteCart = async (req, res, next) => {
    try {
        const { cartId } = req.params;
        const cartKey = `${CART_PREFIX}${cartId}`;
        const result = await redisClient.del(cartKey);

        if (result === 0) {
            return next(createError('Cart not found or already deleted.', 404));
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOrCreateCart,
    getCartById,
    addItemToCart,
    updateItemInCart,
    removeItemFromCart,
    clearCart,
    deleteCart,
    associateCartWithUser,
};