// src/config/consul.js (Universal Template for ALL services - CORRECTED findService return)
const Consul = require('consul');

// Read configuration from environment variables
const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST;
const SERVICE_NAME = process.env.SERVICE_NAME; // e.g., 'auth-service'
const SERVICE_PORT = parseInt(process.env.PORT, 10); // e.g., 3001

// ---- Use POD_IP and POD_HOSTNAME from environment variables (injected by K8s Downward API) ----
const POD_IP = process.env.POD_IP;
const POD_HOSTNAME = process.env.POD_HOSTNAME; // This will be the K8s pod name like 'auth-service-xxxx-yyyyy'

// Construct a unique service ID for Consul. Using POD_HOSTNAME ensures uniqueness across pod restarts.
const SERVICE_ID = `${SERVICE_NAME}-${POD_HOSTNAME || require('os').hostname()}`; // Fallback to os.hostname() if POD_HOSTNAME is not set

// Validate essential environment variables
if (!SERVICE_NAME || !SERVICE_PORT || !CONSUL_AGENT_HOST) {
    console.error(`[Consul Registration] FATAL: Missing SERVICE_NAME (${SERVICE_NAME}), PORT (${SERVICE_PORT}), or CONSUL_AGENT_HOST(${CONSUL_AGENT_HOST}). Cannot register with Consul.`);
    process.exit(1); // Critical failure
}

// Check for POD_IP in Kubernetes environments, warn if not found (outside of tests)
if (!POD_IP && process.env.NODE_ENV !== 'test' && CONSUL_AGENT_HOST.includes('svc')) { // Check if host name likely indicates K8s service name
    console.warn(`[Consul Registration] CRITICAL WARNING for ${SERVICE_NAME}: POD_IP environment variable not found. Consul health checks will likely FAIL in Kubernetes.`);
}

const consul = new Consul({
    host: CONSUL_AGENT_HOST,
    port: 8500, // Standard Consul HTTP port
    promisify: true, // Use promises for async operations
});

// --- MODIFIED registerService function with Retry ---
const registerService = async (maxRetries = 5, retryDelayMs = 3000) => {
    let effectiveAddressForRegistration;
    let effectiveHealthCheckHttpUrl;

    if (POD_IP) { // KUBERNETES Environment (POD_IP is available)
        effectiveAddressForRegistration = POD_IP;
        effectiveHealthCheckHttpUrl = `http://${POD_IP}:${SERVICE_PORT}/health`;
    } else { // LOCAL Docker Compose or Test Environment (POD_IP is NOT available)
        const localHostname = require('os').hostname();
        effectiveAddressForRegistration = localHostname;
        effectiveHealthCheckHttpUrl = `http://${localHostname}:${SERVICE_PORT}/health`;
        if (process.env.NODE_ENV !== 'test') {
            console.warn(`[Consul Registration] ${SERVICE_NAME}: POD_IP not found. Using hostname '${localHostname}'...`); // Shortened log
        }
    }

    const serviceDefinition = {
        name: SERVICE_NAME,
        id: SERVICE_ID,
        address: effectiveAddressForRegistration,
        port: SERVICE_PORT,
        tags: [SERVICE_NAME, `env:${process.env.NODE_ENV || 'unknown'}`],
        check: {
            http: effectiveHealthCheckHttpUrl,
            interval: '10s',
            timeout: '5s',
            deregistercriticalafter: '30s',
            status: 'passing',
        },
    };

    // --- Retry Loop ---
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Consul Registration Attempt ${attempt}/${maxRetries}] ${SERVICE_NAME} (ID: ${SERVICE_ID}): Attempting to register with Consul at ${CONSUL_AGENT_HOST}...`);
            await consul.agent.service.register(serviceDefinition);
            console.log(`[Consul Registration] ${SERVICE_NAME} (ID: ${SERVICE_ID}): Registered successfully with Consul on attempt ${attempt}.`);
            return; // Exit function on successful registration
        } catch (error) {
            console.error(`[Consul Registration Attempt ${attempt}/${maxRetries}] ${SERVICE_NAME} (ID: ${SERVICE_ID}): FAILED to register:`, error.message, error.statusCode || '');
            if (attempt === maxRetries) {
                console.error(`[Consul Registration] ${SERVICE_NAME}: All registration attempts failed. The service WILL LIKELY NOT BE DISCOVERABLE.`);
            } else {
                console.log(`[Consul Registration] Retrying in ${retryDelayMs / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryDelayMs)); // Wait before retrying
            }
        }
    }
}; // --- End MODIFIED registerService function ---

// --- deregisterService Function (Remains the same) ---
const deregisterService = async (signal = 'UNKNOWN') => {
    console.log(`[Consul Deregistration] ${SERVICE_NAME} (ID: ${SERVICE_ID}): Received ${signal}. Starting deregistration from Consul...`);
    try {
        if (consul && consul.agent && consul.agent.service && typeof consul.agent.service.deregister === 'function') {
            await consul.agent.service.deregister(SERVICE_ID);
            console.log(`[Consul Deregistration] ${SERVICE_NAME} (ID: ${SERVICE_ID}): Deregistered successfully from Consul.`);
        } else {
            console.warn(`[Consul Deregistration] ${SERVICE_NAME} (ID: ${SERVICE_ID}): Consul client or agent.service not available or deregister function missing. Skipping Consul deregister call.`);
        }
    } catch (error) {
        console.error(`[Consul Deregistration] ${SERVICE_NAME} (ID: ${SERVICE_ID}): FAILED to deregister from Consul:`, error.message);
    } finally {
        console.log(`[Consul Deregistration] ${SERVICE_NAME} (ID: ${SERVICE_ID}): Process exiting now after deregistration attempt.`);
        process.exit(0);
    }
};

// Graceful shutdown: Handle SIGINT (Ctrl+C) and SIGTERM (from K8s/Docker stop)
process.on('SIGINT', () => deregisterService('SIGINT'));
process.on('SIGTERM', () => deregisterService('SIGTERM'));

// --- findService Function (Used by API Gateway, potentially others) ---
const findService = async (targetServiceName) => {
  try {
    const services = await consul.health.service({
      service: targetServiceName,
      passing: true, // Only get healthy instances
    });

    if (!services || services.length === 0) {
      console.warn(`[Consul Discovery] For ${SERVICE_NAME}: No healthy instances found for target service: ${targetServiceName}`);
      return null; // Return null when no healthy service is found
    }

    // Basic random load balancing for multiple instances
    const instance = services[Math.floor(Math.random() * services.length)];
    const address = instance.Service.Address;
    const port = instance.Service.Port;
    const protocol = instance.Service.Meta?.protocol || 'http';
    const url = `${protocol}://${address}:${port}`;

    // *** Return the URL string directly ***
    return url; // <<<<< CORRECTED RETURN VALUE

  } catch (error) {
    console.error(`[Consul Discovery] For ${SERVICE_NAME}: Error finding target service ${targetServiceName}:`, error.message);
    throw new Error(`Consul discovery failed for ${targetServiceName} (caller: ${SERVICE_NAME})`);
  }
};


module.exports = {
    consul,
    registerService,
    // deregisterService is handled by process signals
    findService, // Export findService as it's used by API Gateway and potentially others
};