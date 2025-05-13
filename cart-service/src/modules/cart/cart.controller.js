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

// Create or get a cart. If cartId is provided and exists, it's returned.
// If no cartId, a new one is created.
// If cartId is provided but doesn't exist, it can optionally create one.
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
            } else {
                // If specific cartId requested but not found, standard is 404.
                // Or, could create one if 'createIfNotExist' flag was present
                // For now, treat as "get" strictly for an existing ID
                // return next(createError('Cart not found', 404));
                // Per discussion, "getCartById" means get OR create if not found.
                // This function will act as getCartByID which means creating if it doesn't exist implicitly
                 console.log(`Cart ID ${cartId} not found, will create a new one with this ID if possible, or generate a new one.`);
            }
        }

        // If no cartId provided, or if the one provided was not found, create a new cart
        const newCartId = cartId || uuidv4(); // Use provided ID if available and policy allows, else generate
        const cartKey = `${CART_PREFIX}${newCartId}`;

        const newCart = {
            id: newCartId,
            userId: userId || null,
            items: [], // Initialize with empty items array
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await redisClient.set(cartKey, JSON.stringify(newCart), 'EX', CART_TTL_SECONDS);
        res.status(201).json(newCart); // 201 for new cart, or 200 if it was retrieved

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
             // Option 1: Create if not found (US 3.1 "je peux ajouter un produit à mon panier" implicitly creates one)
            const newCart = {
                id: cartId, // Use the requested ID
                userId: req.body.userId || null, // Potentially passed if user just logged in
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await redisClient.set(cartKey, JSON.stringify(newCart), 'EX', CART_TTL_SECONDS);
            return res.status(201).json(newCart); // 201 as it's newly created by this request
            // // Option 2: Return 404 if strict "get"
            // return next(createError('Cart not found', 404));
        }

        const cart = JSON.parse(cartDataString);
        await redisClient.expire(cartKey, CART_TTL_SECONDS); // Refresh TTL on access
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
};

const addItemToCart = async (req, res, next) => {
    try {
        const { cartId } = req.params;
        const { productId, variantId, quantity, price, name, imageUrl } = req.body;

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
            // Cart doesn't exist, create a new one
            cart = {
                id: cartId,
                userId: req.body.userId || null, // If provided, associate with user
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        } else {
            cart = JSON.parse(cartDataString);
        }

        // Check if item (product + variant combination) already exists
        const existingItemIndex = cart.items.findIndex(
            item => item.productId === productId && item.variantId === variantId
        );

        if (existingItemIndex > -1) {
            // Item exists, update quantity
            cart.items[existingItemIndex].quantity += parseInt(quantity, 10);
            cart.items[existingItemIndex].price = parseFloat(price); // Update price in case it changed
            if (name) cart.items[existingItemIndex].name = name;
            if (imageUrl) cart.items[existingItemIndex].imageUrl = imageUrl;
        } else {
            // Item does not exist, add new item
            cart.items.push({
                itemId: uuidv4(), // Unique ID for this line item in the cart
                productId,
                variantId,
                quantity: parseInt(quantity, 10),
                price: parseFloat(price), // Store price at the time of adding
                name: name || 'Product Name Unavailable', // Optional: name from client
                imageUrl: imageUrl || null, // Optional: imageUrl from client
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
        const { quantity } = req.body; // Can also update price, name, etc. if needed

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
        // Optionally update price if client sends it:
        // if (req.body.price !== undefined) cart.items[itemIndex].price = parseFloat(req.body.price);

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

// Optional: Explicitly delete cart (otherwise TTL handles it)
const deleteCart = async (req, res, next) => {
    try {
        const { cartId } = req.params;
        const cartKey = `${CART_PREFIX}${cartId}`;
        const result = await redisClient.del(cartKey);

        if (result === 0) {
            return next(createError('Cart not found or already deleted.', 404));
        }

        res.status(204).send(); // No content
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
};
