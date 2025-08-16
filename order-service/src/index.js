// order-service/src/index.js
const { app } = require('./config/app');
const { connectConsumer, disconnectConsumer } = require('./kafka/consumer');
const { connectProducer, disconnectProducer } = require('./kafka/producer');

const PORT = process.env.PORT || 3007;

const startServer = async () => {
    let server;
    try {
        await connectProducer();
        await connectConsumer();
        server = app.listen(PORT, () => {
            console.log(`Order Service running on port ${PORT}`);
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
        console.error('Failed to start Order Service:', error);
        await disconnectProducer().catch(e => console.error("Error on disconnect producer:", e));
        await disconnectConsumer().catch(e => console.error("Error on disconnect consumer:", e));
        process.exit(1);
    }
};
startServer();