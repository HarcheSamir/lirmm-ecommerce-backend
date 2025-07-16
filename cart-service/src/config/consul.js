const Consul = require('consul');
const os = require('os');

// --- Environment-based Configuration ---
const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST;
const SERVICE_NAME = process.env.SERVICE_NAME;
const SERVICE_PORT = parseInt(process.env.PORT, 10);

// --- Kubernetes-specific (from Downward API) ---
const POD_IP = process.env.POD_IP;
const POD_HOSTNAME = process.env.POD_HOSTNAME;

// --- Logic to Determine Environment ---
// A simple way to check if we are in Kubernetes is to see if POD_IP is set.
const IS_IN_KUBERNETES = !!POD_IP;

// --- Determine Service ID and Address for Registration ---
let serviceAddressForRegistration;
let serviceId;

if (IS_IN_KUBERNETES) {
    // In Kubernetes, we MUST use the Pod's IP for health checks to be reachable.
    serviceAddressForRegistration = POD_IP;
    // Use the unique pod hostname for the ID to allow multiple replicas.
    serviceId = `${SERVICE_NAME}-${POD_HOSTNAME || os.hostname()}`;
} else {
    // In Docker Compose, we use the service name (e.g., "auth-service-dev").
    // Docker's internal DNS will resolve this to the container's IP.
    // The hostname of the container itself is a random string we don't want to use.
    serviceAddressForRegistration = SERVICE_NAME; // e.g., "auth-service-dev" from docker-compose
    serviceId = `${SERVICE_NAME}-${os.hostname()}`; // ID can still be unique
}

// --- Validation ---
if (!SERVICE_NAME || !SERVICE_PORT || !CONSUL_AGENT_HOST) {
    console.error(`[Consul] FATAL: Missing SERVICE_NAME, PORT, or CONSUL_AGENT_HOST.`);
    process.exit(1);
}

if (IS_IN_KUBERNETES && !POD_IP) {
    // This case should not be hit if logic is correct, but it's a good safeguard.
    console.error(`[Consul] FATAL: In a Kubernetes environment but POD_IP is not set. Exiting.`);
    process.exit(1);
}

const consul = new Consul({
    host: CONSUL_AGENT_HOST,
    port: 8500,
    promisify: true,
});

const registerService = async (maxRetries = 5, retryDelayMs = 5000) => {
    const serviceDefinition = {
        name: SERVICE_NAME,
        id: serviceId,
        address: serviceAddressForRegistration, // Use the address determined above
        port: SERVICE_PORT,
        tags: [SERVICE_NAME, `env:${process.env.NODE_ENV || 'unknown'}`],
        check: {
            // The health check URL uses the same address.
            http: `http://${serviceAddressForRegistration}:${SERVICE_PORT}/health`,
            interval: '15s',
            timeout: '5s',
            deregistercriticalafter: '60s',
        },
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Consul Attempt ${attempt}/${maxRetries}] Registering ${serviceId} with address ${serviceAddressForRegistration}:${SERVICE_PORT}...`);
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

const deregisterService = async (signal = 'UNKNOWN') => {
    console.log(`[Consul] Received ${signal}. Deregistering ${serviceId}...`);
    try {
        await consul.agent.service.deregister(serviceId);
        console.log(`[Consul] Service ${serviceId} deregistered.`);
    } catch (error) {
        console.error(`[Consul] FAILED to deregister ${serviceId}:`, error.message);
    } finally {
        process.exit(0);
    }
};

process.on('SIGINT', () => deregisterService('SIGINT'));
process.on('SIGTERM', () => deregisterService('SIGTERM'));

const findService = async (targetServiceName) => {
    try {
        // This part of the logic remains the same. Consul provides the correct, reachable
        // address regardless of the environment (Pod IP in K8s, service name in Compose).
        const services = await consul.health.service({
            service: targetServiceName,
            passing: true,
        });

        if (!services || services.length === 0) {
            return null;
        }
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