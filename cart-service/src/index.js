const app = require('./config/app');
const { disconnectRedis } = require('./config/redis');

const PORT = process.env.PORT || 3006;
const SERVICE_NAME = process.env.SERVICE_NAME || 'cart-service';

const server = app.listen(PORT, () => {
    console.log(`${SERVICE_NAME} running on port ${PORT}`);
});

const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down...`);
    server.close(async () => {
        await disconnectRedis();
        console.log('HTTP server closed.');
    });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));