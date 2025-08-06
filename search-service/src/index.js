const app = require('./config/app');
const { connectConsumer, disconnectConsumer } = require('./kafka/consumer');
const { connectClient: connectElasticsearchClient } = require('./config/elasticsearch');

const PORT = process.env.PORT || 3005;

const startServer = async () => {
    try {
        await connectElasticsearchClient();
        await connectConsumer();
        const server = app.listen(PORT, () => {
            console.log(`Search Service running on port ${PORT}`);
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
        console.error('Failed to start Search Service:', error);
        await disconnectConsumer();
        process.exit(1);
    }
};
startServer();