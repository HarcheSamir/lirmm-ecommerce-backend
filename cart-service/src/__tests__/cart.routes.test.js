// src/__tests__/cart.routes.test.js

// --- Mock dependencies FIRST ---
const mockRedisStore = {}; // Simulate Redis store

jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn(key => Promise.resolve(mockRedisStore[key] || null)),
        set: jest.fn((key, value, ex, ttl) => {
            mockRedisStore[key] = value;
            return Promise.resolve('OK');
        }),
        exists: jest.fn(key => Promise.resolve(mockRedisStore[key] ? 1 : 0)),
        del: jest.fn(key => {
            if (mockRedisStore[key]) {
                delete mockRedisStore[key];
                return Promise.resolve(1);
            }
            return Promise.resolve(0);
        }),
        expire: jest.fn(() => Promise.resolve(1)), // Mock expire
        ping: jest.fn(() => Promise.resolve('PONG')), // Mock ping for health check
        status: 'ready', // Mock status for disconnect logic
        quit: jest.fn(() => Promise.resolve('OK')), // Mock quit
        on: jest.fn(), // Mock event listener registration
    }));
});

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-cart-12345'),
}));

// Mock Consul (only findService and registerService needed for app startup/middleware)
jest.mock('../config/consul', () => ({
    registerService: jest.fn().mockResolvedValue(undefined),
    findService: jest.fn().mockResolvedValue('<http://mock-service-url.com>'), // Not directly used by cart logic but for consistency
    consul: {} // Placeholder for consul object if app.js tries to access it
}));


// --- Require application AFTER mocks ---
const request = require('supertest');
const app = require('../config/app'); // Your Express app
const { redisClient } = require('../config/redis'); // Get the mocked client
const { v4: uuidv4 } = require('uuid');


describe('Cart Routes', () => {
    const CART_PREFIX = 'cart:';
    let testCartId;

    beforeEach(() => {
        // Clear all mocks and the mockRedisStore before each test
        jest.clearAllMocks();
        for (const key in mockRedisStore) {
            delete mockRedisStore[key];
        }
        uuidv4.mockReturnValue('new-mock-cart-id'); // Reset UUID mock for POST /
        testCartId = 'fixed-test-cart-id'; // For routes needing a specific ID
    });

    describe('POST / (Create/Get Cart)', () => {
        it('should create a new cart and return it', async () => {
            const response = await request(app)
                .post('/')
                .send({ userId: 'user123' }) // Optional userId
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body.id).toBe('new-mock-cart-id');
            expect(response.body.userId).toBe('user123');
            expect(response.body.items).toEqual([]);
            expect(redisClient.set).toHaveBeenCalledWith(
                `${CART_PREFIX}new-mock-cart-id`,
                expect.any(String),
                'EX',
                expect.any(Number)
            );
        });

        it('should get an existing cart if cartId is provided in body/query and exists', async () => {
            // Pre-populate the cart
            const existingCart = { id: testCartId, userId: 'user-exists', items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            mockRedisStore[`${CART_PREFIX}${testCartId}`] = JSON.stringify(existingCart);

            const response = await request(app)
                .post('/') // Assuming POST to / with cartId means "get or create with this ID"
                .send({ cartId: testCartId })
                .expect(200);

            expect(response.body.id).toBe(testCartId);
            expect(redisClient.get).toHaveBeenCalledWith(`${CART_PREFIX}${testCartId}`);
            expect(redisClient.expire).toHaveBeenCalledWith(`${CART_PREFIX}${testCartId}`, expect.any(Number));
        });

        it('should create a cart with the provided cartId if it does not exist (when POSTing to /)', async () => {
            const customCartId = 'my-custom-cart-id-on-post';
             const response = await request(app)
                .post('/')
                .send({ cartId: customCartId, userId: 'user-custom' })
                .expect(201);

            expect(response.body.id).toBe(customCartId);
            expect(response.body.userId).toBe('user-custom');
            expect(redisClient.set).toHaveBeenCalledWith(
                `${CART_PREFIX}${customCartId}`,
                expect.stringContaining(`"id":"${customCartId}"`),
                'EX',
                expect.any(Number)
            );
        });
    });


    describe('GET /:cartId', () => {
        it('should retrieve an existing cart by ID', async () => {
            const cartData = { id: testCartId, items: [{ productId: 'p1', quantity: 1 }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            mockRedisStore[`${CART_PREFIX}${testCartId}`] = JSON.stringify(cartData);

            const response = await request(app)
                .get(`/${testCartId}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.id).toBe(testCartId);
            expect(response.body.items).toEqual(cartData.items);
            expect(redisClient.get).toHaveBeenCalledWith(`${CART_PREFIX}${testCartId}`);
            expect(redisClient.expire).toHaveBeenCalledWith(`${CART_PREFIX}${testCartId}`, expect.any(Number));
        });

        it('should create a new cart if GET /:cartId and cart does not exist', async () => {
            const newCartIdOnGet = 'new-get-cart-id';
            const response = await request(app)
                .get(`/${newCartIdOnGet}`)
                .expect('Content-Type', /json/)
                .expect(201); // 201 because it's created

            expect(response.body.id).toBe(newCartIdOnGet);
            expect(response.body.items).toEqual([]);
            expect(redisClient.set).toHaveBeenCalledWith(
                `${CART_PREFIX}${newCartIdOnGet}`,
                expect.stringContaining(`"id":"${newCartIdOnGet}"`),
                'EX',
                expect.any(Number)
            );
        });
    });

    describe('POST /:cartId/items', () => {
        const itemToAdd = { productId: 'prod1', variantId: 'var1', quantity: 2, price: 10.99, name: 'Test Item' };

        it('should add an item to an existing cart', async () => {
            const existingCart = { id: testCartId, items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            mockRedisStore[`${CART_PREFIX}${testCartId}`] = JSON.stringify(existingCart);
            uuidv4.mockReturnValueOnce('mock-item-id-1'); // For the itemId

            const response = await request(app)
                .post(`/${testCartId}/items`)
                .send(itemToAdd)
                .expect(200);

            expect(response.body.items.length).toBe(1);
            expect(response.body.items[0].productId).toBe(itemToAdd.productId);
            expect(response.body.items[0].quantity).toBe(itemToAdd.quantity);
            expect(response.body.items[0].itemId).toBe('mock-item-id-1');
            const updatedCartInStore = JSON.parse(mockRedisStore[`${CART_PREFIX}${testCartId}`]);
            expect(updatedCartInStore.items.length).toBe(1);
        });

        it('should add an item and create the cart if it does not exist', async () => {
            uuidv4.mockReturnValueOnce('mock-item-id-2'); // For the itemId

            const response = await request(app)
                .post(`/${testCartId}/items`) // testCartId does not exist yet in mockRedisStore
                .send(itemToAdd)
                .expect(200); // Controller creates cart, then adds item, so 200

            expect(response.body.id).toBe(testCartId);
            expect(response.body.items.length).toBe(1);
            expect(response.body.items[0].productId).toBe(itemToAdd.productId);
            expect(response.body.items[0].itemId).toBe('mock-item-id-2');
            const createdCartInStore = JSON.parse(mockRedisStore[`${CART_PREFIX}${testCartId}`]);
            expect(createdCartInStore).toBeDefined();
            expect(createdCartInStore.items.length).toBe(1);
        });

        it('should update quantity if item already exists in cart', async () => {
            const initialItem = { itemId: 'item-xyz', productId: 'prod1', variantId: 'var1', quantity: 1, price: 10.99, name: 'Test Item', addedAt: new Date().toISOString() };
            const existingCart = { id: testCartId, items: [initialItem], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            mockRedisStore[`${CART_PREFIX}${testCartId}`] = JSON.stringify(existingCart);

            const itemUpdate = { productId: 'prod1', variantId: 'var1', quantity: 3, price: 10.99 }; // Add 3 more

            const response = await request(app)
                .post(`/${testCartId}/items`)
                .send(itemUpdate)
                .expect(200);

            expect(response.body.items.length).toBe(1);
            expect(response.body.items[0].quantity).toBe(1 + 3); // 1 existing + 3 new
        });

        it('should return 400 if required item fields are missing', async () => {
            await request(app)
                .post(`/${testCartId}/items`)
                .send({ productId: 'prod1' }) // Missing variantId, quantity, price
                .expect(400);
        });
    });

    describe('PUT /:cartId/items/:itemId', () => {
        const itemIdToUpdate = 'item-to-update-123';
        const initialCartState = {
            id: testCartId,
            items: [{ itemId: itemIdToUpdate, productId: 'p1', variantId: 'v1', quantity: 1, price: 9.99, name:"Old Name", addedAt: new Date().toISOString() }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        it('should update an items quantity in the cart', async () => {
            mockRedisStore[`${CART_PREFIX}${testCartId}`] = JSON.stringify(initialCartState);
            const response = await request(app)
                .put(`/${testCartId}/items/${itemIdToUpdate}`)
                .send({ quantity: 5 })
                .expect(200);
            expect(response.body.items[0].quantity).toBe(5);
            const updatedCartInStore = JSON.parse(mockRedisStore[`${CART_PREFIX}${testCartId}`]);
            expect(updatedCartInStore.items[0].quantity).toBe(5);
        });

        it('should return 404 if cart not found', async () => {
            await request(app)
                .put(`/nonexistentcart/items/${itemIdToUpdate}`)
                .send({ quantity: 5 })
                .expect(404);
        });
        it('should return 404 if item not found in cart', async () => {
            mockRedisStore[`${CART_PREFIX}${testCartId}`] = JSON.stringify(initialCartState); // Cart exists
            await request(app)
                .put(`/${testCartId}/items/nonexistentitem`)
                .send({ quantity: 5 })
                .expect(404);
        });
         it('should return 400 if quantity is invalid', async () => {
            mockRedisStore[`${CART_PREFIX}${testCartId}`] = JSON.stringify(initialCartState);
            await request(app)
                .put(`/${testCartId}/items/${itemIdToUpdate}`)
                .send({ quantity: 0 }) // Invalid quantity
                .expect(400);
        });
    });

    describe('DELETE /:cartId/items/:itemId', () => {
        const itemIdToRemove = 'item-to-remove-456';
        const initialCartState = {
            id: testCartId,
            items: [
                { itemId: 'other-item-111', productId: 'p_other', variantId: 'v_other', quantity: 1, price: 5.00, name:"Other", addedAt: new Date().toISOString()},
                { itemId: itemIdToRemove, productId: 'p1', variantId: 'v1', quantity: 2, price: 19.99, name:"To Remove", addedAt: new Date().toISOString() }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
         it('should remove an item from the cart', async () => {
            mockRedisStore[`${CART_PREFIX}${testCartId}`] = JSON.stringify(initialCartState);
            const response = await request(app)
                .delete(`/${testCartId}/items/${itemIdToRemove}`)
                .expect(200);
            expect(response.body.items.length).toBe(1);
            expect(response.body.items.find(item => item.itemId === itemIdToRemove)).toBeUndefined();
            const updatedCartInStore = JSON.parse(mockRedisStore[`${CART_PREFIX}${testCartId}`]);
            expect(updatedCartInStore.items.length).toBe(1);
        });
        it('should return 404 if cart not found for item removal', async () => {
            await request(app)
                .delete(`/nonexistentcart/items/${itemIdToRemove}`)
                .expect(404);
        });
        it('should return 404 if item to remove is not found in cart', async () => {
            const cartWithOnlyOtherItem = { ...initialCartState, items: [initialCartState.items[0]]};
            mockRedisStore[`${CART_PREFIX}${testCartId}`] = JSON.stringify(cartWithOnlyOtherItem);
            await request(app)
                .delete(`/${testCartId}/items/nonexistentitemtoremove`)
                .expect(404);
        });
    });

    describe('DELETE /:cartId/items (Clear Cart)', () => {
         const initialCartState = {
            id: testCartId,
            items: [{ itemId: 'item1', quantity: 1 }, { itemId: 'item2', quantity: 2 }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        it('should clear all items from the cart', async () => {
            mockRedisStore[`${CART_PREFIX}${testCartId}`] = JSON.stringify(initialCartState);
            const response = await request(app)
                .delete(`/${testCartId}/items`)
                .expect(200);
            expect(response.body.items).toEqual([]);
            const updatedCartInStore = JSON.parse(mockRedisStore[`${CART_PREFIX}${testCartId}`]);
            expect(updatedCartInStore.items).toEqual([]);
        });
        it('should return 404 if cart to clear is not found', async () => {
            await request(app)
                .delete(`/nonexistentcart/items`)
                .expect(404);
        });
    });

    describe('DELETE /:cartId (Delete Cart)', () => {
        it('should delete the entire cart', async () => {
            mockRedisStore[`${CART_PREFIX}${testCartId}`] = JSON.stringify({ id: testCartId, items: [] });
            await request(app)
                .delete(`/${testCartId}`)
                .expect(204);
            expect(mockRedisStore[`${CART_PREFIX}${testCartId}`]).toBeUndefined();
        });
        it('should return 404 if cart to delete is not found', async () => {
             await request(app)
                .delete(`/nonexistentcartfordeletion`)
                .expect(404);
        });
    });
});

// Test Health Check
describe('GET /health', () => {
    it('should return 200 if Redis pings successfully', async () => {
        redisClient.ping.mockResolvedValue('PONG');
        const response = await request(app).get('/health').expect(200);
        expect(response.body).toEqual({
            status: 'UP',
            service: process.env.SERVICE_NAME || 'cart-service',
            dependencies: { redis: 'UP' },
        });
    });

    it('should return 503 if Redis ping fails', async () => {
        redisClient.ping.mockRejectedValue(new Error('Redis connection failed'));
        const response = await request(app).get('/health').expect(503);
        expect(response.body).toEqual(
            expect.objectContaining({
                status: 'DOWN',
                service: process.env.SERVICE_NAME || 'cart-service',
                dependencies: { redis: 'DOWN' },
                error: 'Redis connection failed',
            })
        );
    });
});
