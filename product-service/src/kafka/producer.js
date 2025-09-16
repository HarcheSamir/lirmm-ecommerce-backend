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
        throw error; 
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
        return; // Fail fast if not connected
    }

    try {
        const message = {
            type: type,       // e.g., 'PRODUCT_CREATED', 'VARIANT_UPDATED'
            payload: payload, // The actual data object
            timestamp: new Date().toISOString(),
            sourceService: SERVICE_NAME,
        };

        const messageKey = key || payload?.id?.toString() || payload?.productId?.toString() || null;

        await producer.send({
            topic: KAFKA_TOPIC,
            messages: [
                { key: messageKey, value: JSON.stringify(message) },
            ],
        });
        console.log(`KAFKA: Message sent to topic [${KAFKA_TOPIC}] | Type: [${type}] | Key: [${messageKey || 'N/A'}]`);
    } catch (error) {
        console.error(`KAFKA: Failed to send message to topic [${KAFKA_TOPIC}] | Type: [${type}] | Error:`, error);

    }
};

module.exports = {
    connectProducer,
    disconnectProducer,
    sendMessage,
    KAFKA_TOPIC,
};