const Consul = require('consul');

const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST;
const SERVICE_NAME = process.env.SERVICE_NAME;
const SERVICE_PORT = parseInt(process.env.PORT, 10);
const POD_IP = process.env.POD_IP;
const POD_HOSTNAME = process.env.POD_HOSTNAME;
const SERVICE_ID = `${SERVICE_NAME}-${POD_HOSTNAME || require('os').hostname()}`;

if (!SERVICE_NAME || !SERVICE_PORT || !CONSUL_AGENT_HOST) {
    console.error(`[Consul] FATAL: Missing SERVICE_NAME, PORT, or CONSUL_AGENT_HOST.`);
    process.exit(1);
}

const consul = new Consul({ host: CONSUL_AGENT_HOST, port: 8500, promisify: true });

const registerService = async (maxRetries = 5, retryDelayMs = 3000) => {
    const effectiveAddress = POD_IP || require('os').hostname();
    const serviceDefinition = {
        name: SERVICE_NAME,
        id: SERVICE_ID,
        address: effectiveAddress,
        port: SERVICE_PORT,
        tags: [SERVICE_NAME],
        check: {
            http: `http://${effectiveAddress}:${SERVICE_PORT}/health`,
            interval: '10s',
            timeout: '5s',
            deregistercriticalafter: '30s',
        },
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Consul] Attempt ${attempt}/${maxRetries} to register ${SERVICE_NAME}...`);
            await consul.agent.service.register(serviceDefinition);
            console.log(`[Consul] ${SERVICE_NAME} registered successfully.`);
            return;
        } catch (error) {
            console.error(`[Consul] FAILED to register on attempt ${attempt}:`, error.message);
            if (attempt === maxRetries) {
                console.error(`[Consul] All registration attempts failed.`);
            } else {
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            }
        }
    }
};

const deregisterService = async (signal = 'UNKNOWN') => {
    console.log(`[Consul] Received ${signal}. Deregistering ${SERVICE_ID}...`);
    try {
        await consul.agent.service.deregister(SERVICE_ID);
        console.log(`[Consul] ${SERVICE_ID} deregistered.`);
    } catch (error) {
        console.error(`[Consul] FAILED to deregister:`, error.message);
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
      console.warn(`[Consul] No healthy instances found for service: ${targetServiceName}`);
      return null;
    }
    const instance = services[Math.floor(Math.random() * services.length)];
    const address = instance.Service.Address;
    const port = instance.Service.Port;
    const url = `http://${address}:${port}`;
    return url;
  } catch (error) {
    console.error(`[Consul] Error finding service ${targetServiceName}:`, error.message);
    throw new Error(`Consul discovery failed for ${targetServiceName}`);
  }
};

module.exports = { registerService, findService };