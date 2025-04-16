const Consul = require('consul');
const os = require('os'); // To get hostname

const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST || '127.0.0.1'; // Default for local run outside Docker
const SERVICE_NAME = process.env.SERVICE_NAME;
const SERVICE_PORT = parseInt(process.env.PORT, 10);
const HOSTNAME = os.hostname(); // Container ID/hostname in Docker is unique enough for dev
const SERVICE_ID = `${SERVICE_NAME}-${HOSTNAME}-${SERVICE_PORT}`; // Unique ID for this instance

// Input validation - Critical for reliable startup
if (!SERVICE_NAME || !SERVICE_PORT || !CONSUL_AGENT_HOST) {
  console.error('FATAL: Missing required environment variables for Consul registration (SERVICE_NAME, PORT, CONSUL_AGENT_HOST)');
  process.exit(1); // Fail fast
}

const consul = new Consul({
  host: CONSUL_AGENT_HOST,
  port: 8500, // Default Consul API port
  promisify: true, // Use Promises
});

const registerService = async () => {
  const serviceDefinition = {
    name: SERVICE_NAME,
    id: SERVICE_ID,
    address: HOSTNAME, // Use container hostname as address within the Docker network
    port: SERVICE_PORT,
    tags: [`node`, `express`, `${SERVICE_NAME}`],
    check: {
      // Basic HTTP health check
      http: `http://${HOSTNAME}:${SERVICE_PORT}/health`,
      interval: '10s', // Check every 10 seconds
      timeout: '5s', // Request timeout
      deregistercriticalafter: '30s', // Deregister if unhealthy for 30 seconds
      status: 'passing', // Initial status
    },
  };

  try {
    console.log(`Registering service '${SERVICE_ID}' with Consul at ${CONSUL_AGENT_HOST}...`);
    await consul.agent.service.register(serviceDefinition);
    console.log(`Service '${SERVICE_ID}' registered successfully.`);
  } catch (error) {
    console.error(`Failed to register service '${SERVICE_ID}' with Consul:`, error);
    // Decide if you want to exit or retry depending on criticality
    process.exit(1); // Exit if registration fails on startup
  }
};

const deregisterService = async () => {
  console.log(`Deregistering service '${SERVICE_ID}' from Consul...`);
  try {
    await consul.agent.service.deregister(SERVICE_ID);
    console.log(`Service '${SERVICE_ID}' deregistered successfully.`);
  } catch (error) {
    console.error(`Failed to deregister service '${SERVICE_ID}':`, error);
  } finally {
    // Ensure process exits even if deregistration fails
    process.exit(0);
  }
};

// Graceful shutdown handling
process.on('SIGINT', deregisterService); // CTRL+C
process.on('SIGTERM', deregisterService); // Docker stop

module.exports = {
  consul, // Export consul client if needed elsewhere (discovery)
  registerService,
  deregisterService,
  // Helper for discovery if needed within the service itself
  async findService(serviceName) {
    try {
      const services = await consul.health.service({
        service: serviceName,
        passing: true, // Only healthy instances
      });
      if (!services || services.length === 0) {
        console.warn(`No healthy instances found for service: ${serviceName}`);
        return null;
      }
      // Basic load balancing: return a random healthy instance
      const instance = services[Math.floor(Math.random() * services.length)];
      return {
        address: instance.Service.Address,
        port: instance.Service.Port,
        url: `http://${instance.Service.Address}:${instance.Service.Port}`
      };
    } catch (error) {
      console.error(`Error finding service ${serviceName} via Consul:`, error);
      throw new Error(`Consul discovery failed for ${serviceName}`);
    }
  }
};