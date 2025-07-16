const app = require('./config/app');
const { registerService } = require('./config/consul');
const { connectProducer, disconnectProducer } = require('./kafka/producer');
const { connectReviewConsumer, disconnectReviewConsumer } = require('./kafka/consumer'); // <-- IMPORT NEW CONSUMER

const PORT = process.env.PORT;

const startServer = async () => {
    try {
        await connectProducer();
        await connectReviewConsumer(); // <-- CONNECT NEW CONSUMER

        const server = app.listen(PORT, async () => {
            console.log(`${process.env.SERVICE_NAME || 'Service'} running on port ${PORT}`);
            await registerService();
        });

        const shutdown = async (signal) => {
            console.log(`${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                console.log('HTTP server closed.');
                await disconnectProducer();
                await disconnectReviewConsumer(); // <-- DISCONNECT NEW CONSUMER
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error('Failed to start Product Service:', error);
        await disconnectProducer();
        await disconnectReviewConsumer(); // <-- DISCONNECT ON FAILURE
        process.exit(1);
    }
};

startServer();