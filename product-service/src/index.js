const app = require('./config/app');
const { registerService } = require('./config/consul');
const { connectProducer, disconnectProducer } = require('./kafka/producer'); // Import producer functions

const PORT = process.env.PORT;

const startServer = async () => {
    try {
        // Connect Kafka Producer before starting server
        await connectProducer();

        const server = app.listen(PORT, async () => {
            console.log(`${process.env.SERVICE_NAME || 'Service'} running on port ${PORT}`);
            try {
                await registerService(); // Register with Consul AFTER server is listening
            } catch (err) {
                console.error('Failed to register service during startup:', err);
                // server.close(() => process.exit(1));
            }
        });

        // Graceful shutdown handler
        const shutdown = async (signal) => {
            console.log(`${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                console.log('HTTP server closed.');
                await disconnectProducer(); // Disconnect Kafka producer
                // Consul deregistration is handled by its own SIGINT/SIGTERM handler
                // process.exit(0); // Deregistration handles exit
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error('Failed to start Book Service:', error);
        await disconnectProducer(); // Attempt disconnect even on startup failure
        process.exit(1);
    }
};

startServer();