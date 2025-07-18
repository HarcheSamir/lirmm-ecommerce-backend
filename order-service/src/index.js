// ===== FILE: order-service/src/index.js =====
const { app, startApp } = require('./config/app');
const { registerService } = require('./config/consul');
const { connectConsumer, disconnectConsumer } = require('./kafka/consumer');


const PORT = process.env.PORT || 3007;

const startServer = async () => {
    let server;
    try {
        await startApp();

        // 1. Start Kafka Consumer before listening for HTTP traffic
        await connectConsumer();

        // 2. Start Express Server
        server = app.listen(PORT, async () => {
            console.log(`Order Service running on port ${PORT}`);
            // 3. Register with Consul
            await registerService();
        });

        // Graceful shutdown handler
        const shutdown = async (signal) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                console.log('HTTP server closed.');
                try {
                    await disconnectConsumer();
                } catch (err) {
                    console.error('Error during Kafka disconnection:', err);
                }
                // Consul's handler will exit the process
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error('Failed to start Order Service:', error);
        await disconnectConsumer().catch(e => console.error("Error disconnecting Kafka on startup failure:", e));
        process.exit(1);
    }
};

startServer();