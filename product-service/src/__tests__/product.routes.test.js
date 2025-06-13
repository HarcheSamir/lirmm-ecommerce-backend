// product-service/src/__tests__/product.routes.test.js

// --- Define Mocks and Environment Variables FIRST ---
jest.mock('../config/prisma', () => ({
    product: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn(), delete: jest.fn()},
    $transaction: jest.fn(),
    variant: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    stockMovement: { create: jest.fn(), createMany: jest.fn() },
    productCategory: { createMany: jest.fn(), deleteMany: jest.fn() },
    productImage: { createMany: jest.fn(), deleteMany: jest.fn(), updateMany: jest.fn(), find: jest.fn() },
    category: { findUnique: jest.fn() }
  }));
  jest.mock('../kafka/producer', () => ({ sendMessage: jest.fn().mockResolvedValue(), connectProducer: jest.fn().mockResolvedValue(), disconnectProducer: jest.fn().mockResolvedValue() }));
  const mockAuthMiddleware = jest.fn((req, res, next) => { req.user = { id: 'mockUserId', role: 'ADMIN' }; next(); });
  jest.mock('../middlewares/auth', () => mockAuthMiddleware);
  jest.mock('../config/consul', () => ({ findService: jest.fn().mockResolvedValue({ url: 'http://mock-auth-service:3001' }), registerService: jest.fn().mockResolvedValue(), deregisterService: jest.fn().mockResolvedValue() }));

  // --- Now Require Application and Dependencies ---
  const request = require('supertest');
  const app = require('../config/app'); // REQUIRE APP AFTER MOCKS
  const prisma = require('../config/prisma');
  const kafkaProducer = require('../kafka/producer');
  const { Prisma } = require('@prisma/client');


  // --- Helper to create a mock Prisma error ---
  const createPrismaError = (message, code, meta = {}) => {
      const error = new Error(message);
      error.code = code;
      error.meta = meta;
      return error;
  }

  // --- Helper for consistent Kafka mock structure ---
  const createMockKafkaPayload = (id, overrides = {}) => {
      const defaults = { id: id, sku: 'MOCK_SKU', name: 'Mock Name', description: null, isActive: true, createdAt: new Date(), updatedAt: new Date(), categories: [], variants: [], images: [], category_names: [], category_slugs: [], variant_attributes_flat: [], primaryImageUrl: null, };
      const merged = { ...defaults, ...overrides };
      if (overrides.categories) merged.categories = overrides.categories; if (overrides.variants) merged.variants = overrides.variants; if (overrides.images) merged.images = overrides.images;
      merged.category_names = (merged.categories || []).map(pc => pc.category?.name).filter(Boolean); merged.category_slugs = (merged.categories || []).map(pc => pc.category?.slug).filter(Boolean); const primaryImage = (merged.images || []).find(img => img.isPrimary === true) || (merged.images || [])[0]; merged.primaryImageUrl = primaryImage?.imageUrl || null; merged.variant_attributes_flat = (merged.variants || []).flatMap(v => Object.entries(v.attributes || {}).map(([key, value]) => `${key}:${value}`)).filter((v, i, a) => a.indexOf(v) === i);
      return merged;
  };


  // --- Test Suite ---
  describe('Product Routes', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
    });

    // --- Test POST / (Create Product) ---
    describe('POST /', () => {
      // Passing tests remain unchanged...
      it('should create a new product successfully', async () => { /* ... */
          const productData = { sku: 'TEST-SKU-001', name: 'Test Product', isActive: true };
          const mockCreatedProduct = { id: 'prod123', ...productData, createdAt: new Date(), updatedAt: new Date() };
          prisma.product.create.mockResolvedValue(mockCreatedProduct);
          prisma.product.findUnique.mockResolvedValueOnce(createMockKafkaPayload('prod123', { sku: productData.sku, name: productData.name }))
                                    .mockResolvedValueOnce({ ...mockCreatedProduct, variants: [], categories: [], images: [] });
          await request(app).post('/').send(productData).expect(201);
          expect(kafkaProducer.sendMessage).toHaveBeenCalledWith('PRODUCT_CREATED', expect.any(Object), 'prod123');
      });
      it('should return 400 if required fields (sku, name) are missing', async () => { /* ... */
          await request(app).post('/').send({ description: 'Incomplete data' }).expect(400);
      });
      it('should create a product with variants, categories, and images', async () => { /* ... */
          const productData = { sku: "VAR-PROD-01", name: "Product With Variants", isActive: true, variants: [ { attributes: {color:"Red", size: "M"}, price: 19.99, initialStockQuantity: 10 }, { attributes: {color: "Blue", size: "L"}, price: 21.99 } ], categoryIds: ["cat1", "cat2"], images: [ { imageUrl: "img1.jpg", isPrimary: true, order: 1 }, { imageUrl: "img2.jpg", order: 2 } ] };
          const mockProductId = 'prod-with-vars-123'; const mockCreatedProduct = { id: mockProductId, sku: productData.sku, name: productData.name, isActive: true, createdAt: new Date(), updatedAt: new Date() };
          prisma.product.create.mockResolvedValue(mockCreatedProduct); prisma.variant.create.mockResolvedValue({}); prisma.variant.update.mockResolvedValue({}); prisma.stockMovement.createMany.mockResolvedValue({ count: 1 }); prisma.productCategory.createMany.mockResolvedValue({ count: 2 }); prisma.productImage.createMany.mockResolvedValue({ count: 2 });
          const kafkaMockData = createMockKafkaPayload(mockProductId, { sku: productData.sku, name: productData.name, categories: [{category: { name: 'Cat1', slug:'cat1' } }, { category: { name: 'Cat2', slug:'cat2' } }], variants: [{ id: 'var1', attributes: {color: "Red", size: "M"}, price: 19.99, stockQuantity: 10 }, { id: 'var2', attributes: {color: "Blue", size: "L"}, price: 21.99, stockQuantity: 0 }], images: [{ id: 'img1', imageUrl: "img1.jpg", isPrimary: true }, { id: 'img2', imageUrl: "img2.jpg" }] });
          const finalResponseData = { ...mockCreatedProduct, variants: kafkaMockData.variants, categories: kafkaMockData.categories.map(c => ({category: c.category})), images: kafkaMockData.images };
          prisma.product.findUnique.mockResolvedValueOnce(kafkaMockData).mockResolvedValueOnce(finalResponseData);
          await request(app).post('/').send(productData).expect(201);
          expect(kafkaProducer.sendMessage).toHaveBeenCalledWith('PRODUCT_CREATED', expect.any(Object), mockProductId);
      });
    });

    // --- Test POST /bulk (Create Many Products) ---
    describe('POST /bulk', () => {
        const mockProductsData = [
            { sku: 'BULK-001', name: 'Bulk Product 1', isActive: true, categoryIds: ['cat1'] },
            { sku: 'BULK-002', name: 'Bulk Product 2', isActive: false, variants: [{ attributes: { size: 'S' }, price: 9.99, initialStockQuantity: 5 }] }
        ];

        it('should create multiple products successfully', async () => {
            // Mock the transaction flow
            const mockCreatedSummaries = [
                { id: 'bulk-prod-1', sku: 'BULK-001' },
                { id: 'bulk-prod-2', sku: 'BULK-002' }
            ];

            // This mock will simulate the loop inside the transaction
            prisma.product.create
                .mockResolvedValueOnce({ id: 'bulk-prod-1', sku: 'BULK-001' })
                .mockResolvedValueOnce({ id: 'bulk-prod-2', sku: 'BULK-002' });
            prisma.productCategory.createMany.mockResolvedValue({ count: 1 });
            prisma.variant.create.mockResolvedValue({ id: 'bulk-var-1' });
            prisma.variant.update.mockResolvedValue({});
            prisma.stockMovement.createMany.mockResolvedValue({ count: 1 });


            // Mock the kafka payload fetching for each created product
            prisma.product.findUnique
                .mockResolvedValueOnce(createMockKafkaPayload('bulk-prod-1', { sku: 'BULK-001', name: 'Bulk Product 1' }))
                .mockResolvedValueOnce(createMockKafkaPayload('bulk-prod-2', { sku: 'BULK-002', name: 'Bulk Product 2' }));

            const response = await request(app)
                .post('/bulk')
                .send(mockProductsData)
                .expect(201);

            expect(response.body.message).toBe('Successfully created 2 products.');
            expect(response.body.createdProducts).toEqual(mockCreatedSummaries);

            // Check if transaction was called
            expect(prisma.$transaction).toHaveBeenCalledTimes(1);

            // Check if kafka messages were sent
            expect(kafkaProducer.sendMessage).toHaveBeenCalledTimes(2);
            expect(kafkaProducer.sendMessage).toHaveBeenCalledWith('PRODUCT_CREATED', expect.objectContaining({ id: 'bulk-prod-1' }), 'bulk-prod-1');
            expect(kafkaProducer.sendMessage).toHaveBeenCalledWith('PRODUCT_CREATED', expect.objectContaining({ id: 'bulk-prod-2' }), 'bulk-prod-2');
        });

        it('should return 400 if request body is not an array', async () => {
            await request(app)
                .post('/bulk')
                .send({ sku: 'not-an-array', name: 'invalid' })
                .expect(400);
        });

        it('should return 400 if request body is an empty array', async () => {
            await request(app)
                .post('/bulk')
                .send([])
                .expect(400);
        });

        it('should return 400 if a product in the array is missing a required field', async () => {
            const invalidData = [
                { sku: 'VALID-001', name: 'Valid Product' },
                { name: 'Product missing SKU' } // Invalid object
            ];
            await request(app)
                .post('/bulk')
                .send(invalidData)
                .expect(400)
                .then(res => {
                    expect(res.body.message).toContain("All products in the array must have 'sku' and 'name'");
                });
        });

        it('should not send any kafka messages if the transaction fails', async () => {
            const error = new Error('Transaction failed');
            prisma.$transaction.mockRejectedValue(error);

            await request(app)
                .post('/bulk')
                .send(mockProductsData)
                .expect(500); // Or whatever the error handler maps this to

            expect(kafkaProducer.sendMessage).not.toHaveBeenCalled();
        });
    });

    // --- Test GET / (Get Products) ---
    describe('GET /', () => {
      // Passing tests remain unchanged...
       it('should return a list of products with pagination', async () => { /* ... */
           const mockProducts = [{ id: 'prod1', name: 'Product 1' }, { id: 'prod2', name: 'Product 2' }];
           prisma.product.findMany.mockResolvedValue(mockProducts); prisma.product.count.mockResolvedValue(2);
           await request(app).get('/?page=1&limit=10').expect(200);
       });
       it('should filter products by categorySlug', async () => { /* ... */
            prisma.product.findMany.mockResolvedValue([]); prisma.product.count.mockResolvedValue(0);
            await request(app).get('/?categorySlug=electronics').expect(200);
            expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { categories: { some: { category: { slug: 'electronics' } } } } }));
       });
    });

    // --- Test GET /id/:id ---
    describe('GET /id/:id', () => {
      // Passing tests remain unchanged...
       it('should return a product if found', async () => { /* ... */
           const productId = 'prod123'; const mockProduct = { id: productId, sku: 'TEST-SKU-001', name: 'Test Product' };
           prisma.product.findUnique.mockResolvedValue(mockProduct);
           await request(app).get(`/id/${productId}`).expect(200);
        });
        it('should return 404 if product not found', async () => { /* ... */
            const productId = 'nonexistentprod'; prisma.product.findUnique.mockResolvedValue(null);
            await request(app).get(`/id/${productId}`).expect(404);
         });
    });

    // --- Test PUT /:id (Update Product Core Details) ---
    describe('PUT /:id', () => {
          // Passing test remains unchanged...
          it('should update product core details successfully', async () => { /* ... */
              const productId = 'prod-to-update'; const updateData = { name: "Updated Name" };
              const mockUpdatedProduct = { id: productId, name: updateData.name, sku: 'SKU', createdAt: new Date(), updatedAt: new Date()};
              prisma.product.update.mockResolvedValue(mockUpdatedProduct);
              prisma.product.findUnique.mockResolvedValue(createMockKafkaPayload(productId, mockUpdatedProduct));
              await request(app).put(`/${productId}`).send(updateData).expect(200);
              expect(kafkaProducer.sendMessage).toHaveBeenCalledWith('PRODUCT_UPDATED', expect.any(Object), productId);
          });

          // --- CORRECTED FAILING TEST ---
          it('should return 404 if product to update is not found', async () => {
              const productId = 'nonexistent-update';
              const updateData = { name: "Updated Name" };
              // Simulate P2025 error
              const originalErrorMessage = 'Record to update not found.'; // The message set by the helper
              const prismaError = createPrismaError(originalErrorMessage, 'P2025', { cause: 'Record to update not found.' });
              prisma.product.update.mockRejectedValue(prismaError);

              const response = await request(app)
                  .put(`/${productId}`)
                  .send(updateData)
                  .expect(404); // Expect 404

              // Assert the exact message returned by the handler, which uses the mock error's message/cause
              expect(response.body.message).toEqual(originalErrorMessage); // <<<<< CORRECTED message assertion
          });
     });

      // --- Test DELETE /:id ---
      describe('DELETE /:id', () => {
        // Passing tests remain unchanged...
         it('should delete a product successfully', async () => { /* ... */
              const productId = 'prod-to-delete'; prisma.product.findUnique.mockResolvedValue({ id: productId }); prisma.product.delete.mockResolvedValue({ id: productId });
              await request(app).delete(`/${productId}`).expect(204);
              expect(kafkaProducer.sendMessage).toHaveBeenCalledWith('PRODUCT_DELETED', { id: productId });
          });
          it('should return 404 if product to delete is not found', async () => { /* ... */
              const productId = 'nonexistent-delete'; prisma.product.findUnique.mockResolvedValue(null);
              await request(app).delete(`/${productId}`).expect(404);
          });
      });

      // --- Test Category/Image Association Routes ---
      describe('POST /:id/categories', () => {
          // Passing tests remain unchanged...
          it('should add categories to a product', async () => { /* ... */
              const productId = 'prod-assoc-cat'; const categoryIds = ['cat1', 'cat2'];
              prisma.product.findUnique.mockResolvedValueOnce({ id: productId }); // Exists check
              prisma.productCategory.createMany.mockResolvedValue({ count: 2 });
              prisma.product.findUnique.mockResolvedValueOnce(createMockKafkaPayload(productId, { categories: [ { category: { name: 'Cat1', slug: 'cat1' } }, { category: { name: 'Cat2', slug: 'cat2' } } ] })); // Kafka check
              await request(app).post(`/${productId}/categories`).send({ categoryIds }).expect(201);
              expect(kafkaProducer.sendMessage).toHaveBeenCalledWith('PRODUCT_UPDATED', expect.any(Object), productId);
          });

          // Passing test remains unchanged (expects 400)
          it('should return 400 if a categoryId is invalid', async () => {
               const productId = 'prod-assoc-cat-fail'; const categoryIds = ['valid-cat', 'invalid-cat'];
               prisma.product.findUnique.mockResolvedValueOnce({ id: productId }); // Exists check
               // Simulate P2003 error
               const prismaError = createPrismaError('Foreign key constraint failed.', 'P2003', { field_name: 'categoryId (index)' });
               prisma.productCategory.createMany.mockRejectedValue(prismaError);

               const response = await request(app)
                   .post(`/${productId}/categories`)
                   .send({ categoryIds })
                   .expect(400); // Expect 400

               // Check message from error handler based on code P2003
               expect(response.body.message).toMatch(/Foreign key constraint failed: categoryId/i);
           });
      });

       describe('DELETE /:id/categories', () => {
         // Passing test remains unchanged...
           it('should remove categories from a product', async () => { /* ... */
               const productId = 'prod-dissoc-cat'; const categoryIds = ['cat1'];
               prisma.productCategory.deleteMany.mockResolvedValue({ count: 1 });
               prisma.product.findUnique.mockResolvedValue(createMockKafkaPayload(productId, { categories: [] })); // Kafka check
               await request(app).delete(`/${productId}/categories`).send({ categoryIds }).expect(200);
               expect(kafkaProducer.sendMessage).toHaveBeenCalledWith('PRODUCT_UPDATED', expect.any(Object), productId);
           });
       });
  });