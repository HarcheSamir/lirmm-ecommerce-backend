const app = require('./config/app');
const { registerService } = require('./config/consul');
const { redisClient, disconnectRedis } = require('./config/redis'); // Import Redis client and disconnect function

const PORT = process.env.PORT || 3006;
const SERVICE_NAME = process.env.SERVICE_NAME || 'cart-service';

const startServer = async () => {
    let server;
    try {
        // Check initial Redis connection status (ioredis connects lazily)
        // A ping will force a connection attempt if not already connected/connecting.
        try {
            await redisClient.ping(); // Ensures client attempts connection
            console.log(`[${SERVICE_NAME}] Initial Redis ping successful.`);
        } catch (redisErr) {
            console.error(`[${SERVICE_NAME}] CRITICAL: Initial Redis connection failed. ${redisErr.message}. Service may not function correctly.`);
            // Depending on requirements, you might choose to exit if Redis is non-negotiable at startup.
            // For now, we'll let it continue and rely on health checks + ioredis auto-reconnect.
        }

        server = app.listen(PORT, async () => {
            console.log(`${SERVICE_NAME} running on port ${PORT}`);
            try {
                await registerService();
            } catch (consulErr) {
                console.error(`[${SERVICE_NAME}] CRITICAL: Failed to register service with Consul:`, consulErr);
                // Consider shutting down if Consul registration fails
                // server.close(() => { disconnectRedis().finally(() => process.exit(1)); });
            }
        });

        server.on('error', (error) => {
            if (error.syscall !== 'listen') throw error;
            console.error(`[${SERVICE_NAME}] Server error: ${error.code} on port ${PORT}.`);
            process.exit(1);
        });

    } catch (error) {
        console.error(`[${SERVICE_NAME}] Failed to start server:`, error);
        await disconnectRedis().finally(() => process.exit(1));
    }

    const shutdown = async (signal) => {
        console.log(`\\n[${SERVICE_NAME}] ${signal} received. Shutting down gracefully...`);
        if (server) {
            server.close(async () => {
                console.log(`[${SERVICE_NAME}] HTTP server closed.`);
                // disconnectRedis is called.
                // Consul deregistration is handled by its own signal handler in consul.js,
                // which will eventually call process.exit().
                // We must call disconnectRedis before consul.js exits the process.
                await disconnectRedis();
                console.log(`[${SERVICE_NAME}] Redis disconnected (or attempt made). Letting Consul handler exit.`);
            });
        } else {
            // If server never started, just disconnect Redis and let Consul handler exit
             await disconnectRedis();
             console.log(`[${SERVICE_NAME}] Server not started. Redis disconnected (or attempt made). Letting Consul handler exit.`);
        }
         // Safety timeout in case consul.js takes too long
         setTimeout(() => {
             console.error(`[${SERVICE_NAME}] Graceful shutdown timed out. Forcing exit.`);
             process.exit(1);
         }, 15000).unref();
    };

    // Important: consul.js handles process.exit via its own SIGINT/SIGTERM handlers.
    // We need to make sure our cleanup (like redis disconnect) happens *before* that.
    // However, since our `deregisterService` in `consul.js` *itself* calls `process.exit(0)`,
    // we need a way for `shutdown` to run its course *before* that exit happens.
    // The signal handlers in consul.js will also trigger.
    // The main problem: `process.exit()` in `consul.js` will terminate before other handlers finish.
    // Solution: Modify `consul.js` deregister to NOT call `process.exit()` if a global flag is set,
    // OR, simply rely on the fact that the HTTP server closing and Redis disconnecting should be quick.
    // The current `consul.js` always exits. This is a general problem.
    // For now, this service will also listen and try to clean up. Best effort.
    // If consul's SIGTERM fires first, it exits. If this service's SIGTERM fires first,
    // it closes server, disconnects redis, THEN consul's SIGTERM may fire or process may already be closing.

    // These local handlers try to clean up resources before consul.js forces an exit.
    // This relies on Node.js calling all listeners for a given signal.
    process.on('SIGINT', () => shutdown('SIGINT from cart-service index.js'));
    process.on('SIGTERM', () => shutdown('SIGTERM from cart-service index.js'));

    process.on('unhandledRejection', async (reason, promise) => {
        console.error(`[${SERVICE_NAME}] Unhandled Rejection at:`, promise, 'reason:', reason);
        if (server) server.close(() => { console.log('HTTP server closed due to unhandled rejection.'); });
        await disconnectRedis().finally(() => process.exit(1));
    });

    process.on('uncaughtException', async (error) => {
        console.error(`[${SERVICE_NAME}] Uncaught Exception:`, error);
        if (server) server.close(() => { console.log('HTTP server closed due to uncaught exception.'); });
        await disconnectRedis().finally(() => process.exit(1));
    });
};

startServer();
