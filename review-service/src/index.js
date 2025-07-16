const { app } = require('./config/app');
const { registerService } = require('./config/consul');
const { connectConsumer, disconnectConsumer } = require('./kafka/consumer');
const { connectProducer, disconnectProducer } = require('./kafka/producer');

const PORT = process.env.PORT || 3008;

const startServer = async () => {
    let server;
    try {
        await connectConsumer();
        await connectProducer();

        server = app.listen(PORT, async () => {
            console.log(`Review Service running on port ${PORT}`);
            await registerService();
        });

        const shutdown = async (signal) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                console.log('HTTP server closed.');
                await disconnectConsumer();
                await disconnectProducer();
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error('Failed to start Review Service:', error);
        await disconnectConsumer().catch(e => console.error("Error disconnecting consumer on failure:", e));
        await disconnectProducer().catch(e => console.error("Error disconnecting producer on failure:", e));
        process.exit(1);
    }
};

startServer();