const app = require('./config/app');
const { registerService } = require('./config/consul');
const { connectProducer, disconnectProducer } = require('./kafka/producer'); // <-- IMPORT

const PORT = process.env.PORT;

const startServer = async () => {
    let server;
    try {
        await connectProducer(); // <-- CONNECT KAFKA FIRST

        server = app.listen(PORT, async () => {
            console.log(`${process.env.SERVICE_NAME || 'Service'} running on port ${PORT}`);
            await registerService();
        });

        const shutdown = async (signal) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                console.log('HTTP server closed.');
                await disconnectProducer(); // <-- DISCONNECT KAFKA
                // Consul handler will exit the process
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error('Failed to start Auth Service:', error);
        await disconnectProducer().catch(e => console.error("Error disconnecting Kafka on startup failure:", e));
        process.exit(1);
    }
};

startServer();