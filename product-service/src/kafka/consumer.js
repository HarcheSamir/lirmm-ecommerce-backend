const { Kafka, logLevel } = require('kafkajs');
const prisma = require('../config/prisma');
const { sendMessage } = require('./producer');
const { fetchAndFormatProductForKafka } = require('../modules/product/product.controller');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'product-service';
const REVIEW_TOPIC = 'review_events';

const kafka = new Kafka({
    clientId: `${SERVICE_NAME}-review-consumer`,
    brokers: KAFKA_BROKERS,
    logLevel: process.env.NODE_ENV === 'development' ? logLevel.INFO : logLevel.WARN,
});

const consumer = kafka.consumer({ groupId: `${SERVICE_NAME}-review-group` });

const processReviewMessage = async ({ message }) => {
    try {
        const event = JSON.parse(message.value.toString());
        if (event.type !== 'REVIEW_UPDATED') return;

        const { productId, averageRating, reviewCount } = event.payload;
        if (!productId) return;

        console.log(`Updating review stats for product ${productId}: Rating=${averageRating}, Count=${reviewCount}`);

        await prisma.product.update({
            where: { id: productId },
            data: {
                averageRating: parseFloat(averageRating) || 0,
                reviewCount: parseInt(reviewCount) || 0,
            },
        });
        
        // After updating, broadcast the full product update to other services (like search)
        const kafkaPayload = await fetchAndFormatProductForKafka(productId);
        if (kafkaPayload) {
            await sendMessage('PRODUCT_UPDATED', kafkaPayload, productId);
        }

    } catch (error) {
        console.error(`Error processing review event: ${error.message}`, error);
    }
};

const connectReviewConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: REVIEW_TOPIC, fromBeginning: true });
        console.log(`Kafka consumer subscribed to topic: [${REVIEW_TOPIC}]`);
        await consumer.run({ eachMessage: processReviewMessage });
    } catch (error) {
        console.error('Failed to connect or run review Kafka consumer:', error);
        throw error;
    }
};

const disconnectReviewConsumer = async () => {
    try {
        await consumer.disconnect();
        console.log('Review Kafka consumer disconnected.');
    } catch (error) {
        console.error('Error disconnecting review Kafka consumer:', error);
    }
};

module.exports = { connectReviewConsumer, disconnectReviewConsumer };