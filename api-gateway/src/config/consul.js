const Consul = require('consul');
const os = require('os');

// Read configuration from environment variables
const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST;
const SERVICE_NAME = process.env.SERVICE_NAME; // Expected 'api-gateway'
const SERVICE_PORT = parseInt(process.env.PORT, 10); // Expected 3000
const HOSTNAME = os.hostname();
const SERVICE_ID = `${SERVICE_NAME}-${HOSTNAME}-${SERVICE_PORT}`;

// Validate essential environment variables
if (!SERVICE_NAME || !SERVICE_PORT || !CONSUL_AGENT_HOST) {
    console.error(`FATAL: Missing required environment variables for API Gateway Consul registration (SERVICE_NAME=${SERVICE_NAME}, PORT=${SERVICE_PORT}, CONSUL_AGENT_HOST=${CONSUL_AGENT_HOST})`);
    process.exit(1);
}

// Initialize Consul client
const consul = new Consul({
    host: CONSUL_AGENT_HOST,
    port: 8500,
    promisify: true,
});

// Function to register the service with Consul
const registerService = async () => {
    const serviceDefinition = {
        name: SERVICE_NAME,
        id: SERVICE_ID,
        address: HOSTNAME,
        port: SERVICE_PORT,
        tags: ['gateway', 'express', SERVICE_NAME], // Use appropriate tags
        check: {
            http: `http://${HOSTNAME}:${SERVICE_PORT}/health`, // Your /health endpoint
            interval: '10s',
            timeout: '5s',
            deregistercriticalafter: '30s',
            status: 'passing',
        },
    };

    try {
        console.log(`[Consul] Registering service '${SERVICE_ID}' with Consul agent at ${CONSUL_AGENT_HOST}...`);
        await consul.agent.service.register(serviceDefinition);
        console.log(`[Consul] Service '${SERVICE_ID}' registered successfully.`);
    } catch (error) {
        console.error(`[Consul] Failed to register service '${SERVICE_ID}':`, error);
        process.exit(1); // Exit if registration fails on startup
    }
};

// Function to deregister the service from Consul
const deregisterService = async () => {
    console.log(`[Consul] Deregistering service '${SERVICE_ID}' from Consul...`);
    try {
        // Added a check to ensure consul client is available before deregistering
        if (consul && consul.agent && consul.agent.service) {
            await consul.agent.service.deregister(SERVICE_ID);
            console.log(`[Consul] Service '${SERVICE_ID}' deregistered successfully.`);
        } else {
            console.warn("[Consul] Consul client not available for deregistration.");
        }
    } catch (error) {
        console.error(`[Consul] Failed to deregister service '${SERVICE_ID}':`, error);
        // Log error but proceed to exit
    } finally {
        console.log("[Consul] Exiting process after deregistration attempt.");
        // Ensure process exits cleanly after attempt
        process.exit(0); // <<< Let SIGINT/SIGTERM handler manage exit
    }
};

// --- Signal Handling for Deregistration (Same as other services) ---
process.on('SIGINT', () => {
    console.log('[Consul] SIGINT received. Starting graceful shutdown and deregistration...');
    deregisterService();
});
process.on('SIGTERM', () => {
    console.log('[Consul] SIGTERM received. Starting graceful shutdown and deregistration...');
    deregisterService();
});
// --- End Signal Handling ---


// --- DISCOVERY LOGIC (Keep your existing function) ---
// Helper function to find a healthy service instance
const findService = async (serviceName) => {
  try {
    const services = await consul.health.service({
      service: serviceName,
      passing: true,
    });

    if (!services || services.length === 0) {
      console.warn(`[Consul Discovery] No healthy instances found for service: ${serviceName}`);
      return null;
    }

    const instance = services[Math.floor(Math.random() * services.length)];
    const address = instance.Service.Address;
    const port = instance.Service.Port;
    const protocol = instance.Service.Meta?.protocol || 'http';
    const target = `${protocol}://${address}:${port}`;

    return target; // Return the URL string

  } catch (error) {
    console.error(`[Consul Discovery] Error finding service ${serviceName}:`, error);
    throw new Error(`Consul discovery failed for ${serviceName}`);
  }
};

// Export necessary functions
module.exports = {
  consul, // Export consul client if needed elsewhere (though unlikely for gateway)
  findService, // Export discovery function
  registerService, // Export registration function for index.js
  deregisterService, // Exported but typically called by signal handlers here
};