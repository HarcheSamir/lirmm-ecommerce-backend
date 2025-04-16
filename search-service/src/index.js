const app = require('./config/app');
const { registerService } = require('./config/consul');
const { connectConsumer, disconnectConsumer } = require('./kafka/consumer');
const { connectClient: connectElasticsearchClient } = require('./config/elasticsearch');

// Ensure PORT matches docker-compose environment variable and Dockerfile EXPOSE
const PORT = process.env.PORT || 3005; // Default Port changed to 3005

const startServer = async () => {
    try {
        // 1. Connect to Elasticsearch & Ensure Index Exists
        await connectElasticsearchClient();
        // Logs moved into connectClient

        // 2. Start Kafka Consumer
        await connectConsumer();
        // Logs moved into connectConsumer

        // 3. Start Express Server
        const server = app.listen(PORT, async () => {
            console.log(`Search Service running on port ${PORT}`); // Use correct PORT
            try {
                // 4. Register with Consul
                await registerService();
            } catch (err) {
                console.error('Failed to register service with Consul during startup:', err);
                // Consider shutting down if Consul registration is critical
            }
        });

        // Graceful shutdown handler
        const shutdown = async (signal) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                console.log('HTTP server closed.');
                try {
                    await disconnectConsumer(); // Disconnect Kafka
                } catch (err) {
                    console.error('Error during Kafka disconnection:', err);
                }
                // Consul deregistration is handled by its own SIGINT/SIGTERM handler
                console.log("Shutdown complete.");
            });
            // Force exit if graceful shutdown takes too long
            setTimeout(() => {
                 console.error("Graceful shutdown timed out. Forcing exit.");
                 process.exit(1);
            }, 10000); // 10 second timeout
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error('Failed to start Search Service:', error);
        // Attempt cleanup on startup failure
        await disconnectConsumer().catch(e => console.error("Error disconnecting Kafka on startup failure:", e));
        process.exit(1);
    }

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1); // Exit on unhandled promise rejection
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1); // Exit on uncaught exception
    });
};

startServer();