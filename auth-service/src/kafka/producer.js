const { Kafka, logLevel } = require('kafkajs');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'auth-service';
const KAFKA_TOPIC = 'auth_events';

const kafka = new Kafka({
    clientId: `${SERVICE_NAME}-producer`,
    brokers: KAFKA_BROKERS,
    logLevel: process.env.NODE_ENV === 'development' ? logLevel.INFO : logLevel.WARN,
    retry: { initialRetryTime: 300, retries: 5 }
});

const producer = kafka.producer();
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

const sendMessage = async (type, payload) => {
    if (!isConnected) {
        console.error(`Kafka producer is not connected. Message Type [${type}] not sent.`);
        return;
    }
    try {
        const message = {
            type,
            payload,
            timestamp: new Date().toISOString(),
            sourceService: SERVICE_NAME,
        };
        await producer.send({
            topic: KAFKA_TOPIC,
            messages: [{ key: payload.id.toString(), value: JSON.stringify(message) }],
        });
        console.log(`KAFKA: Message sent to topic [${KAFKA_TOPIC}] | Type: [${type}] | Key: [${payload.id}]`);
    } catch (error) {
        console.error(`KAFKA: Failed to send message of type [${type}]:`, error);
    }
};

module.exports = {
    connectProducer,
    disconnectProducer,
    sendMessage,
};