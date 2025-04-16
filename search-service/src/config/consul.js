// This file is very similar to the one in auth-service / book-service
const Consul = require('consul');
const os = require('os');

const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST || '127.0.0.1';
const SERVICE_NAME = process.env.SERVICE_NAME; // Should be 'search-service'
const SERVICE_PORT = parseInt(process.env.PORT, 10); // Should be 3003
const HOSTNAME = os.hostname();
const SERVICE_ID = `${SERVICE_NAME}-${HOSTNAME}-${SERVICE_PORT}`;

if (!SERVICE_NAME || !SERVICE_PORT || !CONSUL_AGENT_HOST) {
    console.error('FATAL: Missing required environment variables for Consul registration (SERVICE_NAME, PORT, CONSUL_AGENT_HOST)');
    process.exit(1);
}

const consul = new Consul({
    host: CONSUL_AGENT_HOST,
    port: 8500,
    promisify: true,
});

const registerService = async () => {
    const serviceDefinition = {
        name: SERVICE_NAME,
        id: SERVICE_ID,
        address: HOSTNAME,
        port: SERVICE_PORT,
        tags: [`node`, `express`, `search`],
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
        // Ensure process exits even if deregistration fails
        process.exit(0);
    }
};

// Graceful shutdown handling
process.on('SIGINT', deregisterService); // CTRL+C
process.on('SIGTERM', deregisterService); // Docker stop

module.exports = {
    consul,
    registerService,
    deregisterService,
    // Note: findService helper is not needed within search-service itself
};