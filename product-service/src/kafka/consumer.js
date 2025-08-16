// product-service/src/kafka/consumer.js
const { Kafka, logLevel } = require('kafkajs');
const prisma = require('../config/prisma');
const { sendMessage } = require('./producer');
const { fetchAndFormatProductForKafka } = require('../modules/product/product.controller');
const { performStockAdjustment, reverseStockForOrder } = require('../modules/stock/stock.controller');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'product-service';
const REVIEW_TOPIC = 'review_events';
const ORDER_TOPIC = 'order_events';

const kafka = new Kafka({
    clientId: `${SERVICE_NAME}-consumer`,
    brokers: KAFKA_BROKERS,
    logLevel: process.env.NODE_ENV === 'development' ? logLevel.INFO : logLevel.WARN,
});

const consumer = kafka.consumer({ groupId: `${SERVICE_NAME}-group` });

const processMessage = async ({ topic, message }) => {
    try {
        const event = JSON.parse(message.value.toString());

        if (topic === REVIEW_TOPIC) {
            await handleReviewEvent(event);
        } else if (topic === ORDER_TOPIC) {
            await handleOrderEvent(event);
        }

    } catch (error) {
        console.error(`Error processing Kafka event: ${error.message}`, error);
    }
};

const handleReviewEvent = async (event) => {
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

    const kafkaPayload = await fetchAndFormatProductForKafka(productId);
    if (kafkaPayload) {
        await sendMessage('PRODUCT_UPDATED', kafkaPayload, productId);
    }
};

const handleOrderEvent = async (event) => {
    const order = event.payload;
    if (!order || !order.id || !order.items) {
        console.warn(`[Order Event] Received invalid order event payload.`, event);
        return;
    }

    if (event.type === 'ORDER_CREATED') {
        console.log(`Processing ORDER_CREATED event for order ${order.id}`);
        try {
            for (const item of order.items) {
                await performStockAdjustment(
                    item.variantId,
                    -item.quantity,
                    'ORDER',
                    `Order placement: ${order.id}`,
                    order.id,
                    order.createdAt ? new Date(order.createdAt) : new Date()
                );
            }
            console.log(`Successfully adjusted stock for order ${order.id}`);
        } catch (error) {
            console.error(`Failed to adjust stock for order ${order.id}. Error: ${error.message}`);
            if (error.message === 'InsufficientStock') {
                await sendMessage('ORDER_FAILED', { orderId: order.id, reason: 'Insufficient stock' }, order.id);
            }
        }
    } else if (event.type === 'ORDER_CANCELLED') {
        console.log(`Processing ORDER_CANCELLED event for order ${order.id}`);
        try {
            await reverseStockForOrder(order);
        } catch (error) {
            console.error(`Failed to reverse stock for cancelled order ${order.id}. Error: ${error.message}`);
        }
    }
};

const connectConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topics: [REVIEW_TOPIC, ORDER_TOPIC], fromBeginning: true });
        console.log(`Kafka consumer subscribed to topics: [${REVIEW_TOPIC}, ${ORDER_TOPIC}]`);
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