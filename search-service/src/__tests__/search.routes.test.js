// search-service/src/__tests__/search.routes.test.js

// --- Define Mocks FIRST ---
const mockSearch = jest.fn();
const mockExists = jest.fn(); const mockIndex = jest.fn(); const mockDelete = jest.fn(); const mockPing = jest.fn();
const mockIndicesExists = jest.fn(); const mockIndicesCreate = jest.fn();

// Mock the ES Client constructor and methods
jest.mock('@elastic/elasticsearch', () => ({
    Client: jest.fn(() => ({
        search: mockSearch, exists: mockExists, index: mockIndex, delete: mockDelete, ping: mockPing,
        indices: { exists: mockIndicesExists, create: mockIndicesCreate }
    }))
}));
// Mock Kafka Consumer
jest.mock('../kafka/consumer', () => ({ connectConsumer: jest.fn().mockResolvedValue(), disconnectConsumer: jest.fn().mockResolvedValue() }));
// Mock Consul
jest.mock('../config/consul', () => ({ registerService: jest.fn().mockResolvedValue(), deregisterService: jest.fn().mockResolvedValue(), findService: jest.fn().mockResolvedValue('http://mock-service:1234') }));
// Mock Elasticsearch Config Module Functions
jest.mock('../config/elasticsearch', () => {
    const { Client } = require('@elastic/elasticsearch'); // Get mocked constructor
    return {
        client: new Client(), // Return instance from mocked constructor
        connectClient: jest.fn().mockResolvedValue(),
        ensureIndexExists: jest.fn().mockResolvedValue(), // Assume index exists for tests
        PRODUCT_INDEX: 'products', // Export constant
    };
});

// --- Now Require Application and Dependencies ---
const request = require('supertest');
const app = require('../config/app'); // App require happens AFTER mocks

describe('Search Routes', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockIndicesExists.mockResolvedValue(true); // Default assumption
    });

    // --- Test GET /products ---
    describe('GET /products', () => {
        it('should return search results based on query parameter "q"', async () => {
            const searchQuery = 'phone';
            const mockEsResponse = { hits: { total: { value: 1, relation: 'eq' }, max_score: 1.0, hits: [ { _index: 'products', _id: 'prod1', _score: 1.0, _source: { id: 'prod1', name: 'Smart Phone' } } ] } };
            mockSearch.mockResolvedValue(mockEsResponse);
            await request(app).get(`/products?q=${searchQuery}&limit=5`).expect(200);
            expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({
                 body: expect.objectContaining({ query: expect.objectContaining({ bool: expect.objectContaining({ must: expect.arrayContaining([ expect.objectContaining({ multi_match: expect.objectContaining({ query: searchQuery }) }) ]) }) }) })
             }));
        });

        it('should return 400 if no query parameter or filter is provided', async () => {
            await request(app).get('/products').expect(400);
            expect(mockSearch).not.toHaveBeenCalled();
        });

        it('should handle Elasticsearch client errors gracefully', async () => {
             const searchQuery = 'error-trigger';
             const esError = new Error('ES Error'); esError.meta = { statusCode: 500 };
             mockSearch.mockRejectedValue(esError);
             await request(app).get(`/products?q=${searchQuery}`).expect(500);
             expect(mockSearch).toHaveBeenCalled();
        });

        // --- CORRECTED FAILING TEST ---
        it('should apply category and price filters', async () => {
            mockSearch.mockResolvedValue({ hits: { total: { value: 0 }, hits: [] }}); // Mock empty response is fine
            await request(app).get('/products?category=electronics&minPrice=100&maxPrice=500').expect(200);

            // Assert the specific structure of the filter part of the query
            expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({
                body: expect.objectContaining({
                    query: expect.objectContaining({
                        bool: expect.objectContaining({
                            filter: expect.arrayContaining([ // Check filters array
                                // Check for category filter object structure
                                expect.objectContaining({
                                    nested: {
                                        path: "categories",
                                        query: { term: { "categories.slug": "electronics" } }
                                    }
                                }),
                                // Check for price filter object structure
                                expect.objectContaining({
                                     nested: {
                                         path: "variants",
                                         query: { range: { "variants.price": { gte: 100, lte: 500 } } }
                                     }
                                })
                            ]),
                            must: { match_all: {} } // Check 'must' when 'q' is absent
                        })
                    })
                })
            }));
        });


        it('should handle pagination correctly', async () => {
             mockSearch.mockResolvedValue({ hits: { total: { value: 0 }, hits: [] }});
             await request(app).get('/products?q=gadget&page=3&limit=20').expect(200);
             expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ from: 40, size: 20 }));
        });
    });
});