// ===== FILE: order-service/src/index.js =====
const { app, startApp } = require('./config/app');
const { registerService } = require('./config/consul');

const PORT = process.env.PORT || 3007;

const startServer = async () => {
    try {
        await startApp(); // Perform any async setup from app.js
        app.listen(PORT, async () => {
            console.log(`Order Service running on port ${PORT}`);
            await registerService();
        });
    } catch (error) {
        console.error('Failed to start Order Service:', error);
        process.exit(1);
    }
};

startServer();