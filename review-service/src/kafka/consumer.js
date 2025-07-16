const { Kafka, logLevel } = require('kafkajs');
const prisma = require('../config/prisma');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'review-service';
const PRODUCT_TOPIC = 'product_events';
const AUTH_TOPIC = 'auth_events';

const kafka = new Kafka({
    clientId: `${SERVICE_NAME}-consumer`,
    brokers: KAFKA_BROKERS,
    logLevel: process.env.NODE_ENV === 'development' ? logLevel.INFO : logLevel.WARN,
    retry: { initialRetryTime: 300, retries: 5 }
});

const consumer = kafka.consumer({ groupId: `${SERVICE_NAME}-group` });

const processMessage = async ({ topic, message }) => {
    try {
        const event = JSON.parse(message.value.toString());
        const logId = event.payload?.id || 'N/A';
        console.log(`Received event: Type [${event.type}] from [${event.sourceService}] for ID [${logId}] on Topic [${topic}]`);

        if (topic === PRODUCT_TOPIC) {
            const productData = event.payload;
            if (!productData || !productData.id) return;

            if (event.type === 'PRODUCT_CREATED' || event.type === 'PRODUCT_UPDATED') {
                const primaryImage = productData.images?.find(img => img.isPrimary) || productData.images?.[0];
                await prisma.denormalizedProduct.upsert({
                    where: { id: productData.id },
                    update: { name: productData.name, sku: productData.sku, imageUrl: primaryImage?.imageUrl },
                    create: { id: productData.id, name: productData.name, sku: productData.sku, imageUrl: primaryImage?.imageUrl },
                });
            } else if (event.type === 'PRODUCT_DELETED') {
                await prisma.denormalizedProduct.delete({ where: { id: productData.id } }).catch(() => {});
            }
        }

        if (topic === AUTH_TOPIC) {
            const userData = event.payload;
            if (!userData || !userData.id) return;

            if (event.type === 'USER_CREATED' || event.type === 'USER_UPDATED') {
                await prisma.denormalizedUser.upsert({
                    where: { id: userData.id },
                    update: { name: userData.name, profileImage: userData.profileImage },
                    create: { id: userData.id, name: userData.name, profileImage: userData.profileImage },
                });
            } else if (event.type === 'USER_DELETED') {
                await prisma.denormalizedUser.delete({ where: { id: userData.id } }).catch(() => {});
            }
        }
    } catch (error) {
        console.error(`Error processing Kafka message: ${error.message}`, error);
    }
};

const connectConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topics: [PRODUCT_TOPIC, AUTH_TOPIC], fromBeginning: true });
        console.log(`Kafka consumer subscribed to topics: [${PRODUCT_TOPIC}, ${AUTH_TOPIC}]`);
        await consumer.run({ eachMessage: processMessage });
    } catch (error) {
        console.error('Failed to connect or run Kafka consumer:', error);
        throw error;
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