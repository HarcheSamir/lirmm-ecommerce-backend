const Consul = require('consul');
const os = require('os');

// --- Environment-based Configuration ---
const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST;
const SERVICE_NAME = process.env.SERVICE_NAME;
const SERVICE_PORT = parseInt(process.env.PORT, 10);
const POD_IP = process.env.POD_IP;
const POD_HOSTNAME = process.env.POD_HOSTNAME;
const IS_IN_KUBERNETES = !!process.env.KUBERNETES_SERVICE_HOST; // A more reliable K8s check

// --- Determine Service ID, Registration Address, and Health Check Address ---
let serviceAddressForRegistration;
let healthCheckAddress;
let serviceId;

if (IS_IN_KUBERNETES) {
    // In K8s: Register with the Pod IP. Health check from the agent to the pod must use the IP.
    // However, with Istio, the most reliable health check is via localhost from the sidecar.
    serviceAddressForRegistration = POD_IP;
    healthCheckAddress = 'localhost'; // The Istio proxy intercepts this correctly.
    serviceId = `${SERVICE_NAME}-${POD_HOSTNAME || os.hostname()}`;
} else {
    // In Docker Compose: Register with the service name. Health check from the Consul agent
    // must also use the service name, which Docker DNS will resolve.
    serviceAddressForRegistration = SERVICE_NAME;
    healthCheckAddress = SERVICE_NAME;
    serviceId = `${SERVICE_NAME}-${os.hostname()}`;
}

// --- Validation ---
if (!SERVICE_NAME || !SERVICE_PORT || !CONSUL_AGENT_HOST) {
    console.error(`[Consul] FATAL: Missing required environment variables.`);
    process.exit(1);
}
if (IS_IN_KUBERNETES && !POD_IP) {
    console.error(`[Consul] FATAL: In Kubernetes but POD_IP is not set. Exiting.`);
    process.exit(1);
}

const consul = new Consul({ host: CONSUL_AGENT_HOST, port: 8500, promisify: true });

const registerService = async () => {
    const serviceDefinition = {
        name: SERVICE_NAME,
        id: serviceId,
        address: serviceAddressForRegistration,
        port: SERVICE_PORT,
        tags: [SERVICE_NAME],
        check: {
            // Use the correctly determined address for the health check
            http: `http://${healthCheckAddress}:${SERVICE_PORT}/health`,
            interval: '15s',
            timeout: '5s',
            deregistercriticalafter: '1m',
        },
    };

    try {
        await consul.agent.service.register(serviceDefinition);
        console.log(`[Consul] Service ${serviceId} registered successfully.`);
    } catch (err) {
        console.error(`[Consul] Failed to register service ${serviceId}:`, err);
    }
};

const deregisterService = async (signal) => {
    console.log(`[Consul] Received ${signal}. Deregistering ${serviceId}...`);
    try {
        await consul.agent.service.deregister(serviceId);
        console.log(`[Consul] Service ${serviceId} deregistered.`);
    } catch (err) {
        console.error(`[Consul] Failed to deregister ${serviceId}:`, err.message);
    } finally {
        process.exit(0);
    }
};

process.on('SIGINT', () => deregisterService('SIGINT'));
process.on('SIGTERM', () => deregisterService('SIGTERM'));

const findService = async (targetServiceName) => {
    try {
        const services = await consul.health.service({ service: targetServiceName, passing: true });
        if (!services || services.length === 0) {
            console.warn(`[Consul] Discovery: No healthy instances found for ${targetServiceName}`);
            return null;
        }
        
        const instance = services[Math.floor(Math.random() * services.length)];
        // The address returned by Consul will be correct for the environment
        // (service name in Compose, Pod IP in K8s).
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