const app = require('./config/app');
const { registerService } = require('./config/consul'); // Import registration function

const PORT = process.env.PORT;

const server = app.listen(PORT, async () => {
  console.log(`${process.env.SERVICE_NAME || 'Service'} running on port ${PORT}`); // Use SERVICE_NAME for clarity
  try {
    await registerService(); // Register with Consul AFTER server is listening
  } catch (err) {
    console.error('Failed to register service during startup:', err);
    // Depending on policy, you might want to shutdown the server here
    // server.close(() => process.exit(1));
  }
});

// Handle server close for graceful shutdown (optional but good practice)
process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    // deregisterService will be called by the handler in consul.js
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    // deregisterService will be called by the handler in consul.js
  });
});