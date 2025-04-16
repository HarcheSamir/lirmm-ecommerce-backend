// Load environment variables first if using dotenv (but assuming docker-compose envs)
// require('dotenv').config();

const app = require('./config/app'); // Get the configured Express app
const { registerService /*, deregisterService */ } = require('./config/consul'); // Import registerService
// deregisterService is handled by signals within consul.js

const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'api-gateway'; // Match env var

// --- Main Server Startup Function (async) ---
const startServer = async () => {
    let server; // Variable to hold the server instance

    try {
        // 1. Start the Express Server
        server = app.listen(PORT, async () => { // Make the callback async
            console.log(`${SERVICE_NAME} running on port ${PORT}`);

            // 2. Register with Consul AFTER server is successfully listening
            try {
                await registerService(); // Call the registration function
            } catch (consulErr) {
                // Error during registration is already logged and likely exits in registerService
                console.error(`CRITICAL: Failed initial registration for ${SERVICE_NAME}. Shutting down.`);
                server.close(() => process.exit(1)); // Ensure server stops if registration fails
            }
        });

        // Handle specific server errors like EADDRINUSE
        server.on('error', (error) => {
            if (error.syscall !== 'listen') {
                throw error;
            }
            console.error(`Server Error: ${error.code}. Port ${PORT} might be in use or require privileges.`);
            process.exit(1);
        });

    } catch (error) {
        // Catch errors during initial synchronous setup (before listen)
        console.error(`Failed to start ${SERVICE_NAME}:`, error);
        process.exit(1);
    }

    // --- Global Process Error Handlers ---
    // (Keep these handlers for robustness)
    process.on('uncaughtException', (error) => {
      console.error('UNCAUGHT EXCEPTION! Shutting down...');
      console.error(error);
      // Attempt graceful shutdown if server exists
      if (server) {
          server.close(() => { process.exit(1); });
      } else {
          process.exit(1);
      }
      setTimeout(() => process.exit(1), 5000).unref(); // Force exit
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('UNHANDLED REJECTION! Shutting down...');
      console.error('Reason:', reason);
      if (server) {
          server.close(() => { process.exit(1); });
      } else {
          process.exit(1);
      }
      setTimeout(() => process.exit(1), 5000).unref(); // Force exit
    });

    // Graceful shutdown (SIGTERM/SIGINT are handled by consul.js now)
    // We only need to ensure the HTTP server itself closes if needed,
    // but the process exit is triggered by deregisterService in consul.js
    const gracefulShutdown = (signal) => {
        console.log(`\n${signal} received by index.js. Allowing consul.js to handle shutdown...`);
        // Optional: You might add a timeout here to force exit if consul.js hangs
        // setTimeout(() => {
        //     console.error('Graceful shutdown via consul.js timed out. Forcing exit from index.js.');
        //     process.exit(1);
        // }, 15000).unref(); // Give consul deregister 15 seconds
    };
    // process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Let consul.js handle
    // process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Let consul.js handle

};

// --- Start the Service ---
startServer();