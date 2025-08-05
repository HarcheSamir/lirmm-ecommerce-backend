const app = require('./config/app');

const PORT = process.env.PORT;

const server = app.listen(PORT, () => {
    console.log(`${process.env.SERVICE_NAME || 'Auth Service'} running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

startServer();