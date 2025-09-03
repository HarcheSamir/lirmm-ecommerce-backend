// stats-service/src/kafka/consumer.js
const { Kafka, logLevel } = require('kafkajs');
const prisma = require('../config/prisma');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'stats-service';

const kafka = new Kafka({
    clientId: `${SERVICE_NAME}-consumer`,
    brokers: KAFKA_BROKERS,
    logLevel: process.env.NODE_ENV === 'development' ? logLevel.INFO : logLevel.WARN,
});

const consumer = kafka.consumer({ groupId: `${SERVICE_NAME}-group` });

const getUTCDate = (dateString) => {
    const date = new Date(dateString);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const processMessage = async ({ topic, message }) => {
    try {
        const event = JSON.parse(message.value.toString());
        console.log(`Received event: Type [${event.type}] from [${event.sourceService}] on Topic [${topic}]`);

        if (topic === 'auth_events' && event.type === 'USER_CREATED') {
            await handleUserCreated(event.payload);
        }
        
        if (topic === 'order_events' && event.type === 'ORDER_PAID') {
            await handleOrderPaid(event.payload);
        }

    } catch (error) {
        console.error(`Error processing Kafka event: ${error.message}`, error);
    }
};

const handleUserCreated = async (user) => {
    await prisma.$transaction(async (tx) => {
        const eventDate = user.createdAt ? getUTCDate(user.createdAt) : getUTCDate(new Date().toISOString());

        await tx.kpi.upsert({
            where: { key: 'totalCustomers' },
            update: { value: { increment: 1 } },
            create: { key: 'totalCustomers', label: 'Total Customers', value: 1 },
        });

        const year = eventDate.getUTCFullYear();
        const month = eventDate.getUTCMonth() + 1;

        await tx.monthlyAggregate.upsert({
            where: { year_month: { year, month } },
            update: { newCustomers: { increment: 1 } },
            create: { year, month, newCustomers: 1 },
        });

        await tx.dailyAggregate.upsert({
            where: { date: eventDate },
            update: { newCustomers: { increment: 1 } },
            create: { date: eventDate, newCustomers: 1 },
        });
    });
    console.log("Processed USER_CREATED: Incremented customer KPIs.");
};

const handleOrderPaid = async (order) => {
    await prisma.$transaction(async (tx) => {
        const eventDate = order.createdAt ? getUTCDate(order.createdAt) : getUTCDate(new Date().toISOString());
        const orderTotal = parseFloat(order.totalAmount);
        let orderExpenses = 0;

        for (const item of order.items) {
            const cost = parseFloat(item.costPriceAtTimeOfOrder) || 0;
            orderExpenses += cost * item.quantity;

            await tx.productPerformance.upsert({
                where: { variantId: item.variantId },
                update: {
                    totalQuantitySold: { increment: item.quantity },
                    totalRevenueGenerated: { increment: parseFloat(item.priceAtTimeOfOrder) * item.quantity },
                },
                create: {
                    variantId: item.variantId,
                    productId: item.productId,
                    productName: item.productName,
                    variantAttributes: item.variantAttributes,
                    totalQuantitySold: item.quantity,
                    totalRevenueGenerated: parseFloat(item.priceAtTimeOfOrder) * item.quantity,
                },
            });
        }

        await tx.kpi.upsert({
            where: { key: 'totalOrders' },
            update: { value: { increment: 1 } },
            create: { key: 'totalOrders', label: 'Total Orders', value: 1 },
        });

        await tx.kpi.upsert({
            where: { key: 'totalRevenue' },
            update: { value: { increment: orderTotal } },
            create: { key: 'totalRevenue', label: 'Total Revenue', value: orderTotal },
        });

        const year = eventDate.getUTCFullYear();
        const month = eventDate.getUTCMonth() + 1;

        await tx.monthlyAggregate.upsert({
            where: { year_month: { year, month } },
            update: {
                newOrders: { increment: 1 },
                totalRevenue: { increment: orderTotal },
                totalExpenses: { increment: orderExpenses },
            },
            create: {
                year, month, newOrders: 1, totalRevenue: orderTotal, totalExpenses: orderExpenses,
            },
        });

        await tx.dailyAggregate.upsert({
            where: { date: eventDate },
            update: {
                newOrders: { increment: 1 },
                totalRevenue: { increment: orderTotal },
            },
            create: {
                date: eventDate, newOrders: 1, totalRevenue: orderTotal,
            },
        });
    });
    console.log(`Processed ORDER_PAID for order ${order.id}.`);
};

const connectConsumer = async () => {
    try {
        await consumer.connect();
        const topics = ['auth_events', 'order_events'];
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