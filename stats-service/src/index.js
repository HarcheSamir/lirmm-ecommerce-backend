const { app } = require('./config/app');
const { connectConsumer, disconnectConsumer } = require('./kafka/consumer');

const PORT = process.env.PORT || 3010;

const startServer = async () => {
    let server;
    try {
        await connectConsumer();
        server = app.listen(PORT, () => {
            console.log(`Stats Service running on port ${PORT}`);
        });

        const shutdown = (signal) => {
            console.log(`${signal} received. Shutting down...`);
            server.close(async () => {
                await disconnectConsumer();
                console.log('HTTP server closed.');
            });
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (error) {
        console.error('Failed to start Stats Service:', error);
        await disconnectConsumer().catch(e => console.error("Error on disconnect:", e));
        process.exit(1);
    }
};
startServer();