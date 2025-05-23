// search-service/src/kafka/consumer.js

const { Kafka } = require('kafkajs');
const { client: esClient, PRODUCT_INDEX } = require('../config/elasticsearch');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'search-service';
const KAFKA_TOPIC = 'product_events'; // Consume from product_events

if (!KAFKA_BROKERS || KAFKA_BROKERS.length === 0) {
    console.error('FATAL: Missing required environment variable KAFKA_BROKERS');
    process.exit(1);
}

const kafka = new Kafka({
    clientId: SERVICE_NAME,
    brokers: KAFKA_BROKERS,
    retry: { initialRetryTime: 300, retries: 5 }
});

const consumer = kafka.consumer({ groupId: `${SERVICE_NAME}-group-products` });

// --- Process Message Logic ---
const processMessage = async ({ topic, partition, message }) => {
    try {
        const event = JSON.parse(message.value.toString());
        const productId = event.payload?.id || (typeof event.payload === 'string' ? event.payload : null);
        const logId = productId || 'N/A';
        console.log(`Received event: ${event.type} from topic ${topic}. Product ID: ${logId}`);

        const indexName = PRODUCT_INDEX;

        switch (event.type) {
            case 'PRODUCT_CREATED':
            case 'PRODUCT_UPDATED':
                if (!productId) {
                    console.error(`Invalid payload for ${event.type} event: Missing product ID. Payload:`, event.payload);
                    return;
                }
                if (typeof event.payload !== 'object' || event.payload === null) {
                     console.error(`Invalid payload structure for ${event.type} event: Expected an object. Payload:`, event.payload);
                     return;
                }
                const documentToIndex = event.payload;
                console.log(`Indexing/Updating product ${documentToIndex.id} in index ${indexName}...`);
                await esClient.index({
                    index: indexName,
                    id: documentToIndex.id.toString(),
                    document: documentToIndex,
                });
                console.log(`Product ${documentToIndex.id} indexed/updated successfully.`);
                break;

            case 'PRODUCT_DELETED':
                 if (!productId) {
                    console.error(`Invalid payload for ${event.type} event: Expected product ID or object with ID. Payload:`, event.payload);
                    return;
                }
                console.log(`Deleting product ${productId} from index ${indexName}...`);
                try {
                    const exists = await esClient.exists({ index: indexName, id: productId.toString() });
                    if (exists) {
                        await esClient.delete({ index: indexName, id: productId.toString() });
                        console.log(`Product ${productId} deleted from index.`);
                    } else {
                         console.log(`Product ${productId} not found in index ${indexName} for deletion.`);
                    }
                } catch (error) {
                    console.error(`Error deleting product ${productId} from index ${indexName}:`, error);
                }
                break;

            default:
                console.warn(`Received unknown/unhandled event type: ${event.type}. Ignoring.`);
        }
    } catch (error) {
        console.error('Error processing Kafka message:', error);
        // Consider implementing a dead-letter queue
    }
};
// --- End Process Message Logic ---


// --- Connect/Disconnect Functions (RESTORED/ENSURED PRESENT) ---
const connectConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true }); // fromBeginning might be true/false depending on needs
        console.log(`Kafka consumer subscribed to topic: ${KAFKA_TOPIC}`);

        await consumer.run({
            eachMessage: processMessage,
        });
         console.log('Kafka consumer is running...');
    } catch (error) {
        console.error('Failed to connect or run Kafka consumer:', error);
        throw error; // Propagate error to index.js for startup failure
    }
};

const disconnectConsumer = async () => {
    try {
        await consumer.disconnect();
        console.log('Kafka consumer disconnected.');
    } catch (error) {
        console.error('Error disconnecting Kafka consumer:', error);
    }
};
// --- End Connect/Disconnect Functions ---


module.exports = { connectConsumer, disconnectConsumer }; // <<< Functions are now defined above