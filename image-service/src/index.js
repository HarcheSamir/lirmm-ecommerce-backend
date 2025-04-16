// Load environment variables (from docker-compose)
// No require('dotenv').config(); needed here if vars are set by compose

// Import the configured Express app instance
const app = require('./config/app'); // This MUST export the express app

// Import Consul registration functions
const { registerService, deregisterService } = require('./config/consul');

// Get configuration from environment variables
const PORT = process.env.PORT || 3004; // Default port if not set
const SERVICE_NAME = process.env.SERVICE_NAME || 'image-service';

// --- Main Server Startup Function ---
const startServer = async () => {
    let server; // To hold the server instance for graceful shutdown

    try {
        // 1. Start the Express server
        server = app.listen(PORT, async () => {
            console.log(`${SERVICE_NAME} running on port ${PORT}`);
            console.log(`Access images via base URL: ${process.env.IMAGE_BASE_URL || 'Not Set!'}`);

            // 2. Register with Consul *after* the server is successfully listening
            try {
                await registerService();
            } catch (consulErr) {
                console.error(`CRITICAL: Failed to register ${SERVICE_NAME} with Consul:`, consulErr);
                // Optionally stop the server if Consul registration is mandatory
                // server.close(() => {
                //     console.error('Server stopped due to Consul registration failure.');
                //     process.exit(1);
                // });
            }
        });

        // Handle server startup errors (e.g., port already in use)
        server.on('error', (error) => {
            if (error.syscall !== 'listen') {
                throw error;
            }
            switch (error.code) {
                case 'EACCES':
                    console.error(`Port ${PORT} requires elevated privileges.`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(`Port ${PORT} is already in use.`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });

    } catch (error) {
        // Catch errors during initial setup (e.g., before server.listen)
        console.error(`Failed to start ${SERVICE_NAME}:`, error);
        process.exit(1);
    }

    // --- Graceful Shutdown Logic ---
    const shutdown = async (signal) => {
        console.log(`\n${signal} received. Shutting down ${SERVICE_NAME} gracefully...`);

        // Stop accepting new connections
        if (server) {
            server.close((err) => {
                 if (err) {
                     console.error("Error closing HTTP server:", err);
                     // Deregistration will still be attempted via signal handler in consul.js
                     process.exit(1); // Exit with error if server close fails
                 } else {
                     console.log('HTTP server closed.');
                     // Consul deregistration is handled automatically by the signal handler
                     // in consul.js, which calls process.exit() itself.
                 }
            });
        } else {
             console.log("Server not started, exiting.");
            // If server never started, just exit (consul deregister won't run if startup failed)
             process.exit(0);
        }

        // Force shutdown if graceful exit takes too long
        setTimeout(() => {
            console.error('Graceful shutdown timed out. Forcing exit.');
            process.exit(1);
        }, 10000); // 10 seconds timeout
    };

    // Listen for termination signals (handled by consul.js for deregistration)
    // process.on('SIGINT', () => shutdown('SIGINT')); // Handled by consul.js
    // process.on('SIGTERM', () => shutdown('SIGTERM')); // Handled by consul.js

    // Handle unhandled promise rejections and uncaught exceptions
     process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // Consider attempting graceful shutdown before exiting
        process.exit(1);
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
         // It's generally recommended to exit after an uncaught exception
        process.exit(1);
    });
};

// --- Start the Service ---
startServer();