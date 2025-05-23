const { Kafka, logLevel } = require('kafkajs');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'product-service';
const KAFKA_TOPIC = 'product_events'; // Specific topic for product-related events

if (!KAFKA_BROKERS || KAFKA_BROKERS.length === 0) {
    console.error('FATAL: Missing required environment variable KAFKA_BROKERS');
    process.exit(1);
}

const kafka = new Kafka({
    clientId: `${SERVICE_NAME}-producer`,
    brokers: KAFKA_BROKERS,
    logLevel: process.env.NODE_ENV === 'development' ? logLevel.INFO : logLevel.WARN, // Adjust log level
    retry: {
        initialRetryTime: 300,
        retries: 5
    }
});

const producer = kafka.producer({
    // Consider idempotence: enableIdempotence: true (requires more config on broker/producer)
});
let isConnected = false;

const connectProducer = async () => {
    if (isConnected) return;
    try {
        await producer.connect();
        isConnected = true;
        console.log(`Kafka producer connected successfully to brokers: ${KAFKA_BROKERS.join(',')}`);
    } catch (error) {
        console.error('Failed to connect Kafka producer:', error);
        isConnected = false;
        // Implement more robust retry or exit strategy if connection is critical
        throw error; // Re-throw to potentially stop server startup
    }
};

const disconnectProducer = async () => {
    if (!isConnected) return;
    try {
        await producer.disconnect();
        isConnected = false;
        console.log('Kafka producer disconnected.');
    } catch (error) {
        console.error('Error disconnecting Kafka producer:', error);
    }
};

const sendMessage = async (type, payload, key = null) => {
    if (!isConnected) {
        console.error(`Kafka producer is not connected. Message Type [${type}] not sent.`);
        // Optional: Attempt reconnect or queue message? For simplicity, we just log.
        // try { await connectProducer(); } catch { /* ignore */ }
        // if (!isConnected) return;
        return; // Fail fast if not connected
    }

    try {
        const message = {
            type: type,       // e.g., 'PRODUCT_CREATED', 'VARIANT_UPDATED'
            payload: payload, // The actual data object
            timestamp: new Date().toISOString(),
            sourceService: SERVICE_NAME,
        };

        // Use provided key or default based on payload structure (e.g., product ID, variant ID)
        const messageKey = key || payload?.id?.toString() || payload?.productId?.toString() || null;

        await producer.send({
            topic: KAFKA_TOPIC,
            messages: [
                { key: messageKey, value: JSON.stringify(message) },
            ],
            // acks: -1 // For higher durability guarantee (waits for all in-sync replicas) - default is 1
        });
        console.log(`KAFKA: Message sent to topic [${KAFKA_TOPIC}] | Type: [${type}] | Key: [${messageKey || 'N/A'}]`);
    } catch (error) {
        console.error(`KAFKA: Failed to send message to topic [${KAFKA_TOPIC}] | Type: [${type}] | Error:`, error);
        // Implement more robust error handling (e.g., retry, dead-letter queue)
        // Potentially re-throw if sending is critical for the operation
    }
};

module.exports = {
    connectProducer,
    disconnectProducer,
    sendMessage,
    KAFKA_TOPIC, // Export topic name if needed elsewhere
};