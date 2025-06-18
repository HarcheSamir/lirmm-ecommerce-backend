// order-service/src/kafka/consumer.js
const { Kafka, logLevel } = require('kafkajs');
const prisma = require('../config/prisma');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'order-service';
const KAFKA_TOPIC = 'product_events';

const kafka = new Kafka({
    clientId: `${SERVICE_NAME}-consumer`,
    brokers: KAFKA_BROKERS,
    logLevel: process.env.NODE_ENV === 'development' ? logLevel.INFO : logLevel.WARN,
    retry: { initialRetryTime: 300, retries: 5 }
});

const consumer = kafka.consumer({ groupId: `${SERVICE_NAME}-group` });

// --- Message Processing Logic ---
const processMessage = async ({ topic, partition, message }) => {
    try {
        const event = JSON.parse(message.value.toString());
        const logId = event.payload?.id || 'N/A';

        console.log(`Received event: Type [${event.type}] from [${event.sourceService}] for ID [${logId}]`);

        if (event.type === 'PRODUCT_CREATED' || event.type === 'PRODUCT_UPDATED') {
            const productData = event.payload;
            if (!productData || !productData.id) {
                console.warn('Skipping event with missing product data or ID.');
                return;
            }

            await prisma.product.upsert({
                where: { id: productData.id },
                update: {
                    name: productData.name,
                    sku: productData.sku,
                    imageUrl: productData.primaryImageUrl,
                },
                create: {
                    id: productData.id,
                    name: productData.name,
                    sku: productData.sku,
                    imageUrl: productData.primaryImageUrl,
                },
            });
            console.log(`Upserted denormalized product: ${productData.id}`);

        } else if (event.type === 'PRODUCT_DELETED') {
            const { id } = event.payload;
            if (id) {
                await prisma.product.delete({ where: { id } }).catch(() => console.log(`Product ${id} to delete was not in denormalized table. Ignoring.`));
                console.log(`Deleted denormalized product: ${id}`);
            }
        } else {
            console.warn(`Received unhandled event type: ${event.type}. Ignoring.`);
        }
    } catch (error) {
        console.error(`Error processing Kafka message: ${error.message}`, error);
    }
};

// --- Connection and Disconnection Functions ---
const connectConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true });
        console.log(`Kafka consumer subscribed to topic: ${KAFKA_TOPIC}`);

        await consumer.run({
            eachMessage: processMessage,
        });
        console.log('Kafka consumer is running...');
    } catch (error) {
        console.error('Failed to connect or run Kafka consumer:', error);
        throw error; // Propagate error to fail service startup
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

module.exports = { connectConsumer, disconnectConsumer };