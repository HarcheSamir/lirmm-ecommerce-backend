const Consul = require('consul');
const os = require('os');

// Read configuration from environment variables (set in docker-compose)
const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST; // e.g., 'consul-agent'
const SERVICE_NAME = process.env.SERVICE_NAME; // e.g., 'image-service'
const SERVICE_PORT = parseInt(process.env.PORT, 10); // e.g., 3004
const HOSTNAME = os.hostname(); // Gets the container ID/hostname
const SERVICE_ID = `${SERVICE_NAME}-${HOSTNAME}-${SERVICE_PORT}`; // Unique ID for this instance

// Validate essential environment variables
if (!SERVICE_NAME || !SERVICE_PORT || !CONSUL_AGENT_HOST) {
    console.error('FATAL: Missing required environment variables for Consul registration (SERVICE_NAME, PORT, CONSUL_AGENT_HOST)');
    process.exit(1); // Exit if configuration is missing
}

// Initialize Consul client
const consul = new Consul({
    host: CONSUL_AGENT_HOST,
    port: 8500, // Default Consul API port
    promisify: true, // Use Promises
});

// Function to register the service with Consul
const registerService = async () => {
    const serviceDefinition = {
        name: SERVICE_NAME,
        id: SERVICE_ID,
        address: HOSTNAME, // Register using the container's hostname/IP within the Docker network
        port: SERVICE_PORT,
        tags: ['node', 'express', 'image', SERVICE_NAME], // Add relevant tags
        check: {
            // HTTP health check endpoint provided by this service
            http: `http://${HOSTNAME}:${SERVICE_PORT}/health`,
            interval: '10s', // Check health every 10 seconds
            timeout: '5s', // Request timeout for health check
            deregistercriticalafter: '30s', // Remove service if check fails for 30 seconds
            status: 'passing', // Initial status
        },
    };

    try {
        console.log(`Registering service '${SERVICE_ID}' with Consul at ${CONSUL_AGENT_HOST}...`);
        await consul.agent.service.register(serviceDefinition);
        console.log(`Service '${SERVICE_ID}' registered successfully.`);
    } catch (error) {
        console.error(`Failed to register service '${SERVICE_ID}' with Consul:`, error);
        process.exit(1); // Exit if registration fails on startup
    }
};

// Function to deregister the service from Consul
const deregisterService = async () => {
    console.log(`Deregistering service '${SERVICE_ID}' from Consul...`);
    try {
        await consul.agent.service.deregister(SERVICE_ID);
        console.log(`Service '${SERVICE_ID}' deregistered successfully.`);
    } catch (error) {
        // Log error but don't prevent shutdown
        console.error(`Failed to deregister service '${SERVICE_ID}':`, error);
    } finally {
        // Ensure process exits cleanly after attempt
        process.exit(0);
    }
};

// Handle termination signals for graceful shutdown and deregistration
process.on('SIGINT', deregisterService); // CTRL+C
process.on('SIGTERM', deregisterService); // Docker stop, Kubernetes termination

// Export functions needed by index.js
module.exports = {
    registerService,
    deregisterService,
    // findService could be added here if this service needed to discover others
};