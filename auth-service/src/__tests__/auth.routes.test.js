// auth-service/src/__tests__/auth.routes.test.js

// --- Set Environment Variables FIRST ---
const mockJwtSecret = 'mock-test-secret-for-auth';
process.env.JWT_SECRET = mockJwtSecret; // Set BEFORE any app code reads it

// --- Define Mocks FIRST ---
const mockAuthMiddleware = jest.fn((req, res, next) => {
    // This mock will be used for protected routes like /me
    req.user = { id: 'mockUserId', email: 'test@example.com', name: 'Test User', role: 'USER' };
    next();
});

// --- Apply Mocks BEFORE requiring app ---
jest.mock('../config/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked.jwt.token'),
  verify: jest.fn(), // Mock verify, though not directly used if middleware is mocked
}));

// Mock the actual middleware module BEFORE the app loads it
jest.mock('../middlewares/auth', () => mockAuthMiddleware);


// --- Now Require Application and Supertest ---
const request = require('supertest');
const app = require('../config/app'); // App requires should happen AFTER mocks are defined
const prisma = require('../config/prisma'); // Get the mocked prisma instance
const bcrypt = require('bcrypt');       // Get the mocked bcrypt instance
const jwt = require('jsonwebtoken');     // Get the mocked jwt instance


// --- Test Suite ---
describe('Auth Routes', () => {
  // Clear mocks before each test (standard practice)
  beforeEach(() => {
    jest.clearAllMocks();
    // No need to set JWT_SECRET here anymore, it's set globally above
  });

  // --- Test POST /register ---
  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'newUser123', ...userData });

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual({ message: 'User registered', userId: 'newUser123' });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: userData.name,
          email: userData.email,
          password: 'hashedPassword123',
          role: 'USER',
        },
      });
    });

    it('should return 409 if user already exists', async () => {
      const userData = { name: 'Test User', email: 'existing@example.com', password: 'password123' };
      prisma.user.findUnique.mockResolvedValue({ id: 'existingUser456', email: userData.email });

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toEqual({ message: 'User already exists' });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/register')
        .send({ name: 'Test User' })
        .expect('Content-Type', /json/)
        .expect(400);
      expect(response.body.message).toEqual('Name, email, and password are required');
    });
  });

  // --- Test POST /login ---
  describe('POST /login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginData = { email: 'login@example.com', password: 'password123' };
      const mockUser = { id: 'user123', email: loginData.email, password: 'hashedPassword123', name: 'Login User', role: 'USER' };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ token: 'mocked.jwt.token' });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: loginData.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      // Verify jwt.sign call parameters - check against the secret set *globally*
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role },
        mockJwtSecret, // Correctly expect the globally set mock secret
        { expiresIn: '1h' }
      );
    });

    it('should return 401 if user not found', async () => {
        const loginData = { email: 'notfound@example.com', password: 'password123' };
        prisma.user.findUnique.mockResolvedValue(null);

        const response = await request(app)
            .post('/login')
            .send(loginData)
            .expect('Content-Type', /json/)
            .expect(401);

        expect(response.body.message).toEqual('Invalid credentials');
        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should return 401 if password does not match', async () => {
        const loginData = { email: 'login@example.com', password: 'wrongpassword' };
        const mockUser = { id: 'user123', email: loginData.email, password: 'hashedPassword123' };

        prisma.user.findUnique.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        const response = await request(app)
            .post('/login')
            .send(loginData)
            .expect('Content-Type', /json/)
            .expect(401);

        expect(response.body.message).toEqual('Invalid credentials');
        expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  // --- Test GET /me (Requires Mocking Middleware) ---
  describe('GET /me', () => {
      // No need for beforeAll/afterAll here, the global mock should apply

      it('should return the logged-in user details', async () => {
          const mockLoggedInUser = {
              id: 'mockUserId',
              name: 'Test User',
              email: 'test@example.com',
              role: 'USER',
          };
          // Mock the prisma call made by the /me controller
          prisma.user.findUnique.mockResolvedValue(mockLoggedInUser);

          // Request the protected route; the globally mocked middleware should run
          const response = await request(app)
              .get('/me')
              // No explicit auth header needed because middleware is mocked to pass
              .expect('Content-Type', /json/)
              .expect(200); // Now expects 200 because mock middleware allows access

          expect(response.body).toEqual(mockLoggedInUser);
          // Verify prisma was called with the ID from the mocked middleware user
          expect(prisma.user.findUnique).toHaveBeenCalledWith({
              where: { id: 'mockUserId' },
              select: { id: true, name: true, email: true, role: true }
          });
          // Verify the mock middleware was actually called
          expect(mockAuthMiddleware).toHaveBeenCalled();
      });

      it('should return 404 if the user from token does not exist in DB', async () => {
          prisma.user.findUnique.mockResolvedValue(null); // User deleted after token issued

          const response = await request(app)
              .get('/me')
              .expect('Content-Type', /json/)
              .expect(404); // Now expects 404 because middleware passes, but controller finds no user

          expect(response.body.message).toEqual('User not found');
          // Verify the mock middleware was called
          expect(mockAuthMiddleware).toHaveBeenCalled();
      });
  });

  // TODO: Add tests for /validate route if needed, likely involving jwt.verify mock
});