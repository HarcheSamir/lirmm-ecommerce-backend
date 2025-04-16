const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs'); // File system module (used only for check/create dir)
const errorHandler = require('../middlewares/errorHandler'); // Import the error handler

// --- Create Express App ---
const app = express();

// --- Configuration from Environment Variables ---
// Assumes these are set in docker-compose.yml environment section
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads'; // Use internal container path
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL; // Expected public URL base

if (!IMAGE_BASE_URL) {
    console.warn('WARN: IMAGE_BASE_URL environment variable not set. Image URLs in responses might be incorrect.');
}
if (!process.env.UPLOAD_DIR) {
    console.warn(`WARN: UPLOAD_DIR environment variable not set. Defaulting to ${UPLOAD_DIR}`);
}

// --- Ensure Upload Directory Exists (Run Once at Startup) ---
// Checks if the directory exists inside the container. Relies on Dockerfile/volume mount.
const absoluteUploadDir = path.resolve(UPLOAD_DIR);
if (!fs.existsSync(absoluteUploadDir)) {
     // This shouldn't happen if Dockerfile/volume is correct, but log a warning.
    console.error(`FATAL: Upload directory does not exist inside the container: ${absoluteUploadDir}`);
    console.error('Ensure the directory is created in the Dockerfile or mounted as a volume.');
    process.exit(1);
} else {
     console.log(`Confirmed upload directory exists: ${absoluteUploadDir}`);
     // Optional: Check write permissions here if needed, though volume mounts usually handle this.
}

// --- Multer Configuration (File Upload Handling) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, absoluteUploadDir); // Use the resolved absolute path
    },
    filename: function (req, file, cb) {
        const fileExtension = path.extname(file.originalname);
        const uniqueFilename = `${uuidv4()}${fileExtension}`; // Generate unique filename
        cb(null, uniqueFilename);
    }
});

const fileFilter = (req, file, cb) => {
    // Basic image type validation
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true); // Accept file
    } else {
        // Reject file with a specific error for the handler
        const err = new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP allowed.');
        err.statusCode = 400; // Bad Request
        cb(err, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5 MB limit
    },
    fileFilter: fileFilter
}).single('imageFile'); // Middleware configured to handle ONE file in the 'imageFile' field


// --- Global Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON bodies (might not be needed for image service)
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
// Request logging (use 'dev' format in development)
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));


// --- Routes ---

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME});
});

// Image Upload Endpoint (POST /upload)
// Uses the pre-configured 'upload' multer middleware
app.post('/upload', (req, res, next) => {
    upload(req, res, (err) => { // Call multer middleware processing
        if (err) {
            // Multer error (e.g., file size limit, filter rejection) or other error
            console.error('[Upload Error] Multer processing error:', err.message);
            // Ensure statusCode is set for the global error handler
            if (!err.statusCode) err.statusCode = (err instanceof multer.MulterError) ? 400 : 500;
            return next(err); // Pass error to the global error handler
        }

        // Check if a file was actually uploaded
        if (!req.file) {
            const noFileError = new Error('No image file provided in the "imageFile" form field.');
            noFileError.statusCode = 400;
            return next(noFileError);
        }

        // --- Success Case ---
        // Construct the public URL using the configured base URL and the generated filename
        const imageUrl = IMAGE_BASE_URL ? `${IMAGE_BASE_URL.replace(/\/$/, '')}/images/${req.file.filename}` : `/images/${req.file.filename}`;
        if (!IMAGE_BASE_URL) {
             console.warn('IMAGE_BASE_URL not set, returning relative image URL.');
        }

        console.log(`Image uploaded successfully: ${req.file.filename} (URL: ${imageUrl})`);
        res.status(201).json({
            message: 'Image uploaded successfully!',
            filename: req.file.filename,
            imageUrl: imageUrl, // Provide the accessible URL
            mimetype: req.file.mimetype,
            size: req.file.size,
        });
    });
});

// Static File Serving Endpoint (GET /images/:filename)
// Serves files directly from the upload directory
console.log(`Serving static files from ${absoluteUploadDir} at /images`);
app.use('/images', express.static(absoluteUploadDir));


  
// --- Global Error Handler ---
// This MUST be the last piece of middleware added to the app
app.use(errorHandler);


// --- Export the configured Express App ---
module.exports = app; // <<< ENSURE THIS EXPORT EXISTS AND IS CORRECT