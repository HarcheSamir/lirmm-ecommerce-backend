const app = require('./config/app');
const { connectProducer, disconnectProducer } = require('./kafka/producer');

const PORT = process.env.PORT || 3009;
const SERVICE_NAME = process.env.SERVICE_NAME || 'payment-service';

const startServer = async () => {
    let server;
    try {
        await connectProducer();
        server = app.listen(PORT, () => {
            console.log(`${SERVICE_NAME} running on port ${PORT}`);
        });

        const shutdown = (signal) => {
            console.log(`${signal} received. Shutting down...`);
            server.close(async () => {
                await disconnectProducer();
                console.log('HTTP server closed.');
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error(`Failed to start ${SERVICE_NAME}:`, error);
        await disconnectProducer().catch(e => console.error("Error on disconnect:", e));
        process.exit(1);
    }
};

startServer();