// product-service/src/index.js
const app = require('./config/app');
const { connectProducer, disconnectProducer } = require('./kafka/producer');
const { connectConsumer, disconnectConsumer } = require('./kafka/consumer');

const PORT = process.env.PORT;

const startServer = async () => {
    try {
        await connectProducer();
        await connectConsumer();
        const server = app.listen(PORT, () => {
            console.log(`Product Service running on port ${PORT}`);
        });

        const shutdown = (signal) => {
            console.log(`${signal} received. Shutting down...`);
            server.close(async () => {
                await disconnectProducer();
                await disconnectConsumer();
                console.log('HTTP server closed.');
            });
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error('Failed to start Product Service:', error);
        await disconnectProducer();
        await disconnectConsumer();
        process.exit(1);
    }
};
startServer();