const Redis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const SERVICE_NAME = process.env.SERVICE_NAME || 'cart-service';

const redisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  retryStrategy: (times) => {
    // Exponential backoff retry strategy
    const delay = Math.min(times * 50, 2000); // Max 2 seconds
    console.warn(`[${SERVICE_NAME}] Redis: Retry connection attempt ${times}, delaying for ${delay}ms...`);
    return delay;
  },
  maxRetriesPerRequest: 3, // Only retry a given command 3 times
};

const redisClient = new Redis(redisOptions);

redisClient.on('connect', () => {
  console.log(`[${SERVICE_NAME}] Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
});

redisClient.on('ready', () => {
  console.log(`[${SERVICE_NAME}] Redis client ready.`);
});

redisClient.on('error', (err) => {
  console.error(`[${SERVICE_NAME}] Redis Error:`, err.message);

});

redisClient.on('close', () => {
  console.log(`[${SERVICE_NAME}] Redis connection closed.`);
});

redisClient.on('reconnecting', (delay) => {
  console.log(`[${SERVICE_NAME}] Redis reconnecting in ${delay}ms...`);
});

redisClient.on('end', () => {
  console.log(`[${SERVICE_NAME}] Redis connection ended. No more reconnections will be attempted.`);
});

// Graceful shutdown
const disconnectRedis = async () => {
  if (redisClient.status === 'ready' || redisClient.status === 'connecting' || redisClient.status === 'reconnecting') {
    try {
      console.log(`[${SERVICE_NAME}] Disconnecting from Redis...`);
      await redisClient.quit(); // Gracefully close connection
      console.log(`[${SERVICE_NAME}] Redis client disconnected successfully.`);
    } catch (error) {
      console.error(`[${SERVICE_NAME}] Error during Redis disconnection:`, error);
      // Force disconnect if quit fails
      redisClient.disconnect();
    }
  } else {
     console.log(`[${SERVICE_NAME}] Redis client not connected, no need to disconnect.`);
  }
};

module.exports = {
  redisClient,
  disconnectRedis,
};
