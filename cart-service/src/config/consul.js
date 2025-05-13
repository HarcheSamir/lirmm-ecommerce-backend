// src/config/consul.js (Universal Template for ALL services)
const Consul = require('consul');

// Read configuration from environment variables
const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST;
const SERVICE_NAME = process.env.SERVICE_NAME;
const SERVICE_PORT = parseInt(process.env.PORT, 10);

const POD_IP = process.env.POD_IP;
const POD_HOSTNAME = process.env.POD_HOSTNAME;

const SERVICE_ID = `${SERVICE_NAME}-${POD_HOSTNAME || require('os').hostname()}`;

if (!SERVICE_NAME || !SERVICE_PORT || !CONSUL_AGENT_HOST) {
    console.error(`[Consul Registration] FATAL: Missing SERVICE_NAME (${SERVICE_NAME}), PORT (${SERVICE_PORT}), or CONSUL_AGENT_HOST(${CONSUL_AGENT_HOST}). Cannot register with Consul.`);
    process.exit(1);
}

if (!POD_IP && process.env.NODE_ENV !== 'test' && CONSUL_AGENT_HOST.includes('svc')) {
    console.warn(`[Consul Registration] CRITICAL WARNING for ${SERVICE_NAME}: POD_IP environment variable not found. Consul health checks will likely FAIL in Kubernetes.`);
}

const consul = new Consul({
    host: CONSUL_AGENT_HOST,
    port: 8500,
    promisify: true,
});

const registerService = async (maxRetries = 5, retryDelayMs = 3000) => {
    let effectiveAddressForRegistration;
    let effectiveHealthCheckHttpUrl;

    if (POD_IP) {
        effectiveAddressForRegistration = POD_IP;
        effectiveHealthCheckHttpUrl = `http://${POD_IP}:${SERVICE_PORT}/health`;
    } else {
        const localHostname = require('os').hostname();
        effectiveAddressForRegistration = localHostname;
        effectiveHealthCheckHttpUrl = `http://${localHostname}:${SERVICE_PORT}/health`;
        if (process.env.NODE_ENV !== 'test') {
            console.warn(`[Consul Registration] ${SERVICE_NAME}: POD_IP not found. Using hostname '${localHostname}' for registration.`);
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
            deregistercriticalafter: '30s', // Longer for potential Redis slow ping
            status: 'passing', // Initial status
        },
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Consul Registration Attempt ${attempt}/${maxRetries}] ${SERVICE_NAME} (ID: ${SERVICE_ID}): Attempting to register with Consul at ${CONSUL_AGENT_HOST}...`);
            await consul.agent.service.register(serviceDefinition);
            console.log(`[Consul Registration] ${SERVICE_NAME} (ID: ${SERVICE_ID}): Registered successfully with Consul on attempt ${attempt}.`);
            return;
        } catch (error) {
            console.error(`[Consul Registration Attempt ${attempt}/${maxRetries}] ${SERVICE_NAME} (ID: ${SERVICE_ID}): FAILED to register:`, error.message, error.statusCode || '');
            if (attempt === maxRetries) {
                console.error(`[Consul Registration] ${SERVICE_NAME}: All registration attempts failed. The service WILL LIKELY NOT BE DISCOVERABLE.`);
            } else {
                console.log(`[Consul Registration] Retrying in ${retryDelayMs / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            }
        }
    }
};

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

process.on('SIGINT', () => deregisterService('SIGINT'));
process.on('SIGTERM', () => deregisterService('SIGTERM'));

const findService = async (targetServiceName) => {
  try {
    const services = await consul.health.service({
      service: targetServiceName,
      passing: true,
    });
    if (!services || services.length === 0) {
      console.warn(`[Consul Discovery] For ${SERVICE_NAME}: No healthy instances found for target service: ${targetServiceName}`);
      return null;
    }
    const instance = services[Math.floor(Math.random() * services.length)];
    const address = instance.Service.Address;
    const port = instance.Service.Port;
    const protocol = instance.Service.Meta?.protocol || 'http';
    const url = `${protocol}://${address}:${port}`;
    return url;
  } catch (error) {
    console.error(`[Consul Discovery] For ${SERVICE_NAME}: Error finding target service ${targetServiceName}:`, error.message);
    throw new Error(`Consul discovery failed for ${targetServiceName} (caller: ${SERVICE_NAME})`);
  }
};

module.exports = {
    consul,
    registerService,
    findService,
};
