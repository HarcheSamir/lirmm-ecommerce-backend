const Consul = require('consul');
const os = require('os'); // To get hostname

const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST || '127.0.0.1'; // Default for local run outside Docker
const SERVICE_NAME = process.env.SERVICE_NAME || 'product-service'; // Set in .env
const SERVICE_PORT = parseInt(process.env.PORT, 10); // Set in .env
const HOSTNAME = os.hostname(); // Container ID/hostname in Docker
const SERVICE_ID = `${SERVICE_NAME}-${HOSTNAME}-${SERVICE_PORT}`; // Unique ID for this instance

// Input validation
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
        tags: ['node', 'express', 'product', SERVICE_NAME], // Added 'product' tag
        check: {
            http: `http://${HOSTNAME}:${SERVICE_PORT}/health`,
            interval: '10s',
            timeout: '5s',
            deregistercriticalafter: '30s',
            status: 'passing',
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

const deregisterService = async () => {
    console.log(`Deregistering service '${SERVICE_ID}' from Consul...`);
    try {
        await consul.agent.service.deregister(SERVICE_ID);
        console.log(`Service '${SERVICE_ID}' deregistered successfully.`);
    } catch (error) {
        console.error(`Failed to deregister service '${SERVICE_ID}':`, error);
    } finally {
        process.exit(0); // Ensure process exits even if deregistration fails
    }
};

// Graceful shutdown handling
process.on('SIGINT', deregisterService); // CTRL+C
process.on('SIGTERM', deregisterService); // Docker stop

// Helper for service discovery
async function findService(serviceName) {
    try {
        const services = await consul.health.service({
            service: serviceName,
            passing: true, // Only healthy instances
        });
        if (!services || services.length === 0) {
            console.warn(`CONSUL: No healthy instances found for service: ${serviceName}`);
            return null;
        }
        // Basic load balancing: return a random healthy instance
        const instance = services[Math.floor(Math.random() * services.length)];
        const protocol = instance.Service.Meta?.protocol || 'http'; // Allow specifying protocol via meta if needed
        return {
            id: instance.Service.ID,
            address: instance.Service.Address,
            port: instance.Service.Port,
            url: `${protocol}://${instance.Service.Address}:${instance.Service.Port}`
        };
    } catch (error) {
        console.error(`CONSUL: Error finding service ${serviceName} via Consul:`, error);
        throw new Error(`Consul discovery failed for ${serviceName}`);
    }
}


module.exports = {
    consul,
    registerService,
    deregisterService,
    findService,
};