const app = require('./config/app');

const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'api-gateway';

const server = app.listen(PORT, () => {
    console.log(`${SERVICE_NAME} running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});