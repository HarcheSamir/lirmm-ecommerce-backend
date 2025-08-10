const { Kafka, logLevel } = require('kafkajs');
const { startOfDay } = require('date-fns');
const prisma = require('../config/prisma');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'stats-service';
const ORDER_TOPIC = 'order_events';
const AUTH_TOPIC = 'auth_events';
const PAYMENT_TOPIC = 'payment_events';

const kafka = new Kafka({
    clientId: `${SERVICE_NAME}-consumer`,
    brokers: KAFKA_BROKERS,
    logLevel: logLevel.WARN,
});

const consumer = kafka.consumer({ groupId: `${SERVICE_NAME}-group` });

const processMessage = async ({ topic, message }) => {
    try {
        const event = JSON.parse(message.value.toString());
        const { type, payload } = event;

        if (topic === AUTH_TOPIC && type === 'USER_CREATED') {
            const date = startOfDay(new Date(payload.createdAt || Date.now()));
            await prisma.dailyAggregate.upsert({
                where: { date },
                create: { date, newCustomersCount: 1 },
                update: { newCustomersCount: { increment: 1 } },
            });
            console.log(`Processed USER_CREATED for date: ${date.toISOString().split('T')[0]}`);
        }

        if (topic === PAYMENT_TOPIC && type === 'PAYMENT_SUCCESS') {
            // NOTE: The `order_service` would need to publish more order details for full real-time updates.
            // For now, this consumer focuses on what it can derive directly from events.
            // The backfill remains the primary source of truth for detailed historical data.
            const date = startOfDay(new Date(event.timestamp || Date.now()));
            await prisma.dailyAggregate.upsert({
                where: { date },
                create: { date, totalRevenue: payload.amount, ordersCount: 1 },
                update: {
                    totalRevenue: { increment: parseFloat(payload.amount) },
                    ordersCount: { increment: 1 },
                },
            });
             console.log(`Processed PAYMENT_SUCCESS for date: ${date.toISOString().split('T')[0]}`);
        }
    } catch (error) {
        console.error(`Error processing Kafka message: ${error.message}`, error);
    }
};

const connectConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topics: [AUTH_TOPIC, PAYMENT_TOPIC], fromBeginning: true });
        console.log(`Kafka consumer subscribed to topics: [${AUTH_TOPIC}, ${PAYMENT_TOPIC}]`);
        await consumer.run({ eachMessage: processMessage });
    } catch (error) {
        console.error('Failed to connect or run Kafka consumer:', error);
        throw error;
    }
};

const disconnectConsumer = async () => {
    try {
        await consumer.disconnect();
    } catch (error) {
        console.error('Error disconnecting Kafka consumer:', error);
    }
};

module.exports = { connectConsumer, disconnectConsumer };