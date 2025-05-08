// image-service/src/__tests__/image.routes.test.js

// --- MOCK fs FIRST ---
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn().mockReturnValue(true),
}));

// --- Set Environment Variables SECOND ---
const mockImageUrl = 'http://test.domain.com';
process.env.UPLOAD_DIR = '/app/uploads';
process.env.IMAGE_BASE_URL = mockImageUrl;
process.env.NODE_ENV = 'test';

// --- Define Other Mocks THIRD ---
const mockUuid = 'mock-uuid-12345';
jest.mock('uuid', () => ({
    v4: jest.fn(() => mockUuid),
}));

// --- Mock the specific Middleware returned by multer().single() ---
// This is the core of bypassing the actual file write
const mockUploadMiddleware = jest.fn((req, res, next) => {
    // Determine file validity based on a header set by the test case
    // This is more reliable than inspecting internal properties.
    const simulate = req.headers['x-test-simulate'];

    if (simulate === 'success') {
         // Simulate successful upload: populate req.file
         req.file = {
             fieldname: 'imageFile',
             originalname: 'placeholder.png',
             encoding: '7bit',
             mimetype: 'image/png',
             destination: process.env.UPLOAD_DIR,
             filename: `${mockUuid}.png`, // Use mocked uuid
             path: `${process.env.UPLOAD_DIR}/${mockUuid}.png`,
             size: 12345 // Mock size
         };
         return next(); // Proceed to the route handler
    } else if (simulate === 'invalid-type') {
         // Simulate fileFilter rejection
         const err = new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP allowed.');
         err.statusCode = 400;
         return next(err);
    } else { // Default to simulating "No file provided"
         const noFileError = new Error('No image file provided in the "imageFile" form field.');
         noFileError.statusCode = 400;
         return next(noFileError);
    }
});

// --- Corrected Multer Mock ---
jest.mock('multer', () => {
    const multer = jest.fn(() => ({
        single: jest.fn((fieldName) => {
            if (fieldName === 'imageFile') {
                return mockUploadMiddleware; // Return the mock middleware
            }
            return (req, res, next) => next();
        }),
    }));
    multer.diskStorage = jest.fn(() => ({ _mockStorageEngine: true })); // Mock static method
    multer.MulterError = class MulterError extends Error { constructor(code, field) { super(code); this.code = code; this.field = field; this.name = 'MulterError'; } };
    return multer;
});


// --- Now Require Application and Dependencies FOURTH ---
const request = require('supertest');
const app = require('../config/app'); // app require MUST come AFTER ALL mocks
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Get mocked uuid instance


describe('Image Routes', () => {
    // Static paths to placeholder files (still needed for .attach())
    const validPlaceholderPath = path.resolve(__dirname, 'placeholder.png');
    const invalidPlaceholderPath = path.resolve(__dirname, 'placeholder.txt');

    beforeEach(() => {
        jest.clearAllMocks();
        require('fs').existsSync.mockReturnValue(true); // Reset fs mock if needed
        mockUploadMiddleware.mockClear();
    });


    // --- Test POST /upload ---
    describe('POST /upload', () => {

        it('should upload an image successfully', async () => {
            const response = await request(app)
                .post('/upload')
                // Attach the file AND set header to guide the mock
                .attach('imageFile', validPlaceholderPath)
                .set('X-Test-Simulate', 'success') // Tell mock middleware to simulate success
                .expect('Content-Type', /json/)
                .expect(201);

            const expectedFilename = `${mockUuid}.png`;
            const expectedUrl = `${mockImageUrl}/images/${expectedFilename}`;

            expect(response.body).toEqual(expect.objectContaining({
                message: 'Image uploaded successfully!',
                filename: expectedFilename,
                imageUrl: expectedUrl,
                mimetype: 'image/png',
                size: 12345,
            }));
            expect(mockUploadMiddleware).toHaveBeenCalled(); // Verify mock middleware ran
            // REMOVED: expect(uuidv4).toHaveBeenCalled(); - This is not called when middleware is mocked
        });

        it('should return 400 if no file is provided', async () => {
            const response = await request(app)
                .post('/upload')
                // No .attach() call, no specific header needed for this case in mock
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body.message).toMatch(/No image file provided/i);
            expect(mockUploadMiddleware).toHaveBeenCalled();
        });

        it('should return 400 if file type is invalid', async () => {
             const response = await request(app)
                .post('/upload')
                .attach('imageFile', invalidPlaceholderPath) // Attach invalid file
                .set('X-Test-Simulate', 'invalid-type') // Tell mock middleware to simulate invalid type
                .expect('Content-Type', /json/)
                .expect(400); // Expect 400

             expect(response.body.message).toMatch(/Invalid file type/i); // Assert correct message
             expect(mockUploadMiddleware).toHaveBeenCalled();
        });
    });
});