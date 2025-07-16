const Consul = require('consul');
const os = require('os');

// --- Environment-based Configuration ---
const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST;
const SERVICE_NAME = process.env.SERVICE_NAME;
const SERVICE_PORT = parseInt(process.env.PORT, 10);
const POD_IP = process.env.POD_IP;
const POD_HOSTNAME = process.env.POD_HOSTNAME;
const IS_IN_KUBERNETES = !!POD_IP;

// --- Determine Service ID and Registration Address ---
let serviceAddressForRegistration;
let serviceId;

if (IS_IN_KUBERNETES) {
    serviceAddressForRegistration = POD_IP;
    serviceId = `${SERVICE_NAME}-${POD_HOSTNAME || os.hostname()}`;
} else {
    // For Docker Compose
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
        tags: [SERVICE_NAME, `env:${process.env.NODE_ENV || 'unknown'}`],
        check: {
            // THE CRITICAL FIX IS HERE:
            // The health check is now performed against localhost *inside the pod*.
            // The Istio proxy intercepts this call correctly and routes it to the
            // application container listening on the same port. This is the standard
            // and most reliable method in a service mesh.
            http: `http://localhost:${SERVICE_PORT}/health`,
            interval: '15s',
            timeout: '5s',
            deregistercriticalafter: '1m',
        },
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Consul Attempt ${attempt}/${maxRetries}] Registering ${serviceId}...`);
            await consul.agent.service.register(serviceDefinition);
            console.log(`[Consul] Service ${serviceId} registered successfully.`);
            return;
        } catch (error) {
            console.error(`[Consul Attempt ${attempt}/${maxRetries}] FAILED to register ${serviceId}:`, error.message);
            if (attempt === maxRetries) {
                console.error(`[Consul] All registration attempts failed.`);
            } else {
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            }
        }
    }
};

// No changes to deregister or findService
const deregisterService = async (signal = 'UNKNOWN') => { /* ... no changes ... */ };
process.on('SIGINT', () => deregisterService('SIGINT'));
process.on('SIGTERM', () => deregisterService('SIGTERM'));
const findService = async (targetServiceName) => { /* ... no changes ... */ };

// THE EXPORTS ARE ALSO WRONG IN THE PREVIOUS VERSION. This is the correct set.
module.exports = {
    registerService,
    findService,
};