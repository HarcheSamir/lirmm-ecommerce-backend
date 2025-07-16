const Consul = require('consul');
const os = require('os');

const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST;
const SERVICE_NAME = process.env.SERVICE_NAME;
const SERVICE_PORT = parseInt(process.env.PORT, 10);

const POD_IP = process.env.POD_IP;
const POD_HOSTNAME = process.env.POD_HOSTNAME;
const IS_IN_KUBERNETES = !!POD_IP;

let serviceAddressForRegistration;
let serviceId;

if (IS_IN_KUBERNETES) {
    serviceAddressForRegistration = POD_IP;
    serviceId = `${SERVICE_NAME}-${POD_HOSTNAME || os.hostname()}`;
} else {
    // In Docker Compose, your service name in docker-compose.yml is the hostname.
    // e.g., 'auth-service' for auth-service.
    // We register with this name so Consul agent can resolve it.
    serviceAddressForRegistration = SERVICE_NAME;
    serviceId = `${SERVICE_NAME}-${os.hostname()}`;
}

if (!SERVICE_NAME || !SERVICE_PORT || !CONSUL_AGENT_HOST) {
    console.error(`[Consul] FATAL: Missing required environment variables.`);
    process.exit(1);
}

if (IS_IN_KUBERNETES && !POD_IP) {
    console.error(`[Consul] FATAL: In Kubernetes but POD_IP is not set. Exiting.`);
    process.exit(1);
}

const consul = new Consul({
    host: CONSUL_AGENT_HOST,
    port: 8500,
    promisify: true,
});

const registerService = async (maxRetries = 5, retryDelayMs = 3000) => {
    const serviceDefinition = {
        name: SERVICE_NAME,
        id: serviceId,
        address: serviceAddressForRegistration,
        port: SERVICE_PORT,
        tags: [SERVICE_NAME],
        check: {
            // In Docker Compose, Consul agent is on the same network, so it can resolve the service name.
            // In K8s, it uses the direct Pod IP, which is also reachable by the agent.
            http: `http://${serviceAddressForRegistration}:${SERVICE_PORT}/health`,
            interval: '15s',
            timeout: '5s',
            deregistercriticalafter: '1m',
        },
    };
    
    // ... (rest of the registerService function is the same)
};

const deregisterService = async (signal = 'UNKNOWN') => { /* ... (no changes) ... */ };

process.on('SIGINT', () => deregisterService('SIGINT'));
process.on('SIGTERM', () => deregisterService('SIGTERM'));

const findService = async (targetServiceName) => {
    try {
        const services = await consul.health.service({ service: targetServiceName, passing: true });
        if (!services || services.length === 0) return null;
        
        const instance = services[Math.floor(Math.random() * services.length)];
        const address = instance.Service.Address;
        const port = instance.Service.Port;
        return `http://${address}:${port}`;

    } catch (error) {
        console.error(`[Consul] Error finding service ${targetServiceName}:`, error.message);
        throw new Error(`Consul discovery failed for ${targetServiceName}`);
    }
};

module.exports = {
    registerService,
    findService,
};