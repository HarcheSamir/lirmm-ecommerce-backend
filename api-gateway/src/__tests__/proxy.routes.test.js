// api-gateway/src/__tests__/proxy.routes.test.js
const request = require('supertest');
const app = require('../config/app'); // Path to your Express app
const consul = require('../config/consul'); // Import the actual consul module

// --- Mock Consul ---
// Mock only the findService function
jest.mock('../config/consul', () => ({
  findService: jest.fn(), // Mock the discovery function
  registerService: jest.fn().mockResolvedValue(), // Mock registration if called during setup
  deregisterService: jest.fn().mockResolvedValue(), // Mock deregistration
}));

// Mock http-proxy-middleware onError behavior if needed, but testing the absence of a target is simpler

describe('API Gateway Proxy Routes', () => {
  let consoleErrorSpy; // Declare spy variable

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore console.error before each test runs if it was spied on
    if (consoleErrorSpy) {
        consoleErrorSpy.mockRestore();
    }
  });

  afterEach(() => {
      // Ensure mocks are restored even if a test fails mid-way
      if (consoleErrorSpy) {
          consoleErrorSpy.mockRestore();
      }
  });


  // --- Test Proxying (example: /auth route) ---
  describe('Proxying to auth-service', () => {
    it('should return 503 if auth-service cannot be discovered', async () => {
      // Mock findService to return null (service unavailable)
      consul.findService.mockResolvedValue(null);

      // Silence console.error for this expected error path
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const response = await request(app)
        .get('/auth/login') // Try accessing a route handled by the auth-service proxy
        .expect('Content-Type', /json/) // Error originates *before* proxy, our handler sends JSON
        .expect(503); // Expect Service Unavailable

      expect(response.body.message).toMatch(/Service 'auth-service' unavailable/i);
      expect(consul.findService).toHaveBeenCalledWith('auth-service');
    });

    it('should attempt to proxy if auth-service is discovered (but likely fail without target)', async () => {
      // Mock findService to return a *mock* URL
      const mockTargetUrl = 'http://mock-auth-service:3001';
      consul.findService.mockResolvedValue(mockTargetUrl);

      // Silence console.error for this expected error path
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // We expect the proxy attempt to fail because the mock URL doesn't exist
      const response = await request(app)
        .get('/auth/login') // Or any other proxied path
        .expect(res => {
            if (res.status < 500) throw new Error(`Expected >= 500 status, got ${res.status}`);
        });

      expect(response.text || response.body.message).toMatch(/Proxy Error|Gateway Timeout|ECONNREFUSED|Error occurred while trying to proxy/i);
      expect(consul.findService).toHaveBeenCalledWith('auth-service');
    });
  });

   // --- Test Proxying /products ---
    describe('Proxying to product-service', () => {
        it('should return 503 if product-service cannot be discovered', async () => {
            consul.findService.mockResolvedValue(null);
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Silence log
            const response = await request(app)
                .get('/products/some-id') // Example product route
                .expect('Content-Type', /json/)
                .expect(503);
            expect(response.body.message).toMatch(/Service 'product-service' unavailable/i);
            expect(consul.findService).toHaveBeenCalledWith('product-service');
        });

        it('should attempt to proxy if product-service is discovered (but likely fail)', async () => {
            const mockTargetUrl = 'http://mock-product-service:3003';
            consul.findService.mockResolvedValue(mockTargetUrl);
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Silence log
            const response = await request(app)
                .get('/products/some-id')
                .expect(res => {
                    if (res.status < 500) throw new Error(`Expected >= 500 status, got ${res.status}`);
                });
            expect(response.text || response.body.message).toMatch(/Proxy Error|Gateway Timeout|ECONNREFUSED|Error occurred while trying to proxy/i);
            expect(consul.findService).toHaveBeenCalledWith('product-service');
        });
    });

    // --- Test Proxying /images ---
    describe('Proxying to image-service', () => {
        it('should return 503 if image-service cannot be discovered', async () => {
            consul.findService.mockResolvedValue(null);
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Silence log
            const response = await request(app)
                .get('/images/some-image.jpg') // Example image route
                .expect('Content-Type', /json/)
                .expect(503);
            expect(response.body.message).toMatch(/Service 'image-service' unavailable/i);
            expect(consul.findService).toHaveBeenCalledWith('image-service');
        });

        it('should attempt to proxy if image-service is discovered (but likely fail)', async () => {
            const mockTargetUrl = 'http://mock-image-service:3004';
            consul.findService.mockResolvedValue(mockTargetUrl);
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Silence log
            const response = await request(app)
                .get('/images/some-image.jpg')
                .expect(res => {
                    if (res.status < 500) throw new Error(`Expected >= 500 status, got ${res.status}`);
                });
            expect(response.text || response.body.message).toMatch(/Proxy Error|Gateway Timeout|ECONNREFUSED|Error occurred while trying to proxy/i);
            expect(consul.findService).toHaveBeenCalledWith('image-service');
        });
    });

    // --- Test Proxying /search ---
    describe('Proxying to search-service', () => {
        it('should return 503 if search-service cannot be discovered', async () => {
            consul.findService.mockResolvedValue(null);
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Silence log
            const response = await request(app)
                .get('/search/products?q=test') // Example search route
                .expect('Content-Type', /json/)
                .expect(503);
            expect(response.body.message).toMatch(/Service 'search-service' unavailable/i);
            expect(consul.findService).toHaveBeenCalledWith('search-service');
        });

        it('should attempt to proxy if search-service is discovered (but likely fail)', async () => {
            const mockTargetUrl = 'http://mock-search-service:3005';
            consul.findService.mockResolvedValue(mockTargetUrl);
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Silence log
            const response = await request(app)
                .get('/search/products?q=test')
                .expect(res => {
                    if (res.status < 500) throw new Error(`Expected >= 500 status, got ${res.status}`);
                });
            expect(response.text || response.body.message).toMatch(/Proxy Error|Gateway Timeout|ECONNREFUSED|Error occurred while trying to proxy/i);
            expect(consul.findService).toHaveBeenCalledWith('search-service');
        });
    });
});