// stats-service/src/kafka/consumer.js
const { Kafka, logLevel } = require('kafkajs');
const prisma = require('../config/prisma');
const { startOfDay } = require('date-fns');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'stats-service';
const ORDER_TOPIC = 'order_events';
const AUTH_TOPIC = 'auth_events';
const PRODUCT_TOPIC = 'product_events';

const kafka = new Kafka({
    clientId: `${SERVICE_NAME}-consumer`,
    brokers: KAFKA_BROKERS,
    logLevel: process.env.NODE_ENV === 'development' ? logLevel.INFO : logLevel.WARN,
});

const consumer = kafka.consumer({ groupId: `${SERVICE_NAME}-group` });

const processMessage = async ({ topic, partition, message }) => {
    try {
        const event = JSON.parse(message.value.toString());
        const logId = event.payload?.id || 'N/A';
        console.log(`Received event: Type [${event.type}] from [${event.sourceService}] for ID [${logId}]`);

        if (topic === AUTH_TOPIC && event.type === 'USER_CREATED') {
            const user = event.payload;
            const creationDate = startOfDay(new Date(user.createdAt));
            await prisma.dailyAggregate.upsert({
                where: { date: creationDate },
                create: { date: creationDate, newCustomerCount: 1 },
                update: { newCustomerCount: { increment: 1 } },
            });
        }
        
        if (topic === PRODUCT_TOPIC && event.type === 'PRODUCT_UPDATED') {
            const product = event.payload;
            await prisma.productPerformance.update({
                where: { productId: product.id },
                data: { productName: product.name }
            }).catch(() => {});
        }
        
        // *** THIS IS THE FIX ***
        // Now listens for ORDER_PAID in addition to ORDER_CREATED.
        if (topic === ORDER_TOPIC && (event.type === 'ORDER_CREATED' || event.type === 'ORDER_PAID')) {
            const order = event.payload;
            if (!['PAID', 'DELIVERED'].includes(order.status)) return;
            
            const orderDate = startOfDay(new Date(order.createdAt));
            let orderRevenue = 0;
            let orderCogs = 0;

            for (const item of order.items) {
                const itemRevenue = parseFloat(item.priceAtTimeOfOrder) * item.quantity;
                const itemCogs = parseFloat(item.costPriceAtTimeOfOrder || 0) * item.quantity;
                orderRevenue += itemRevenue;
                orderCogs += itemCogs;

                await prisma.productPerformance.upsert({
                    where: { productId: item.productId },
                    create: {
                        productId: item.productId,
                        productName: item.productName,
                        totalUnitsSold: item.quantity,
                        totalRevenueGenerated: itemRevenue,
                    },
                    update: {
                        productName: item.productName,
                        totalUnitsSold: { increment: item.quantity },
                        totalRevenueGenerated: { increment: itemRevenue },
                    },
                });
            }

            await prisma.dailyAggregate.upsert({
                where: { date: orderDate },
                create: {
                    date: orderDate,
                    revenue: orderRevenue,
                    cogs: orderCogs,
                    orderCount: 1,
                },
                update: {
                    revenue: { increment: orderRevenue },
                    cogs: { increment: orderCogs },
                    orderCount: { increment: 1 },
                },
            });
        }

    } catch (error) {
        console.error(`Error processing Kafka message: ${error.message}`, error);
    }
};

const connectConsumer = async () => {
    try {
        await consumer.connect();
        const topics = [ORDER_TOPIC, AUTH_TOPIC, PRODUCT_TOPIC];
        await consumer.subscribe({ topics, fromBeginning: true });
        console.log(`Kafka consumer subscribed to topics: [${topics.join(', ')}]`);
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