const app = require('./config/app');

const PORT = process.env.PORT || 3004;
const SERVICE_NAME = process.env.SERVICE_NAME || 'image-service';

const server = app.listen(PORT, () => {
    console.log(`${SERVICE_NAME} running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('HTTP server closed.');
    });
});