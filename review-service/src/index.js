const app = require('./config/app');
const { connectConsumer, disconnectConsumer } = require('./kafka/consumer');
const { connectProducer, disconnectProducer } = require('./kafka/producer');

const PORT = process.env.PORT || 3008;

const startServer = async () => {
    let server;
    try {
        await connectConsumer();
        await connectProducer();
        server = app.listen(PORT, () => {
            console.log(`Review Service running on port ${PORT}`);
        });

        const shutdown = (signal) => {
            console.log(`${signal} received. Shutting down...`);
            server.close(async () => {
                await disconnectConsumer();
                await disconnectProducer();
                console.log('HTTP server closed.');
            });
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (error) {
        console.error('Failed to start Review Service:', error);
        await disconnectConsumer();
        await disconnectProducer();
        process.exit(1);
    }
};
startServer();