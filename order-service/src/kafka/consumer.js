const { Kafka, logLevel } = require('kafkajs');
const prisma = require('../config/prisma');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'order-service';
const PRODUCT_TOPIC = 'product_events';
const AUTH_TOPIC = 'auth_events';
const PAYMENT_TOPIC = 'payment_events';

const kafka = new Kafka({
    clientId: `${SERVICE_NAME}-consumer`,
    brokers: KAFKA_BROKERS,
    logLevel: process.env.NODE_ENV === 'development' ? logLevel.INFO : logLevel.WARN,
    retry: { initialRetryTime: 300, retries: 5 }
});

const consumer = kafka.consumer({ groupId: `${SERVICE_NAME}-group` });

const processMessage = async ({ topic, partition, message }) => {
    try {
        const event = JSON.parse(message.value.toString());
        const logId = event.payload?.id || event.payload?.orderId || 'N/A';

        console.log(`Received event: Type [${event.type}] from [${event.sourceService}] for ID [${logId}] on Topic [${topic}]`);

        if (topic === PRODUCT_TOPIC) {
            const productData = event.payload;
            if (!productData || !productData.id) {
                console.warn('Skipping product event with missing data or ID.');
                return;
            }

            if (event.type === 'PRODUCT_CREATED' || event.type === 'PRODUCT_UPDATED') {
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
            }
        }

        if (topic === AUTH_TOPIC) {
            const userData = event.payload;
            if (!userData || !userData.id) {
                console.warn('Skipping auth event with missing user data or ID.');
                return;
            }

            if (event.type === 'USER_CREATED' || event.type === 'USER_UPDATED') {
                await prisma.denormalizedUser.upsert({
                    where: { id: userData.id },
                    update: {
                        name: userData.name,
                        email: userData.email,
                        profileImage: userData.profileImage,
                    },
                    create: {
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        profileImage: userData.profileImage,
                    },
                });
                console.log(`Upserted denormalized user: ${userData.id}`);
            } else if (event.type === 'USER_DELETED') {
                await prisma.denormalizedUser.delete({ where: { id: userData.id } }).catch(() => console.log(`User ${userData.id} todelete was not in denormalized table. Ignoring.`));
                console.log(`Deleted denormalized user: ${userData.id}`);
            }
        }

        if (topic === PAYMENT_TOPIC) {
            const paymentData = event.payload;
            if (!paymentData || !paymentData.orderId) {
                console.warn('Skipping payment event with missing data or orderId.');
                return;
            }

            const { orderId, status, transactionId, reason } = paymentData;
            let dataToUpdate = {};

            if (status === 'PAYMENT_SUCCESS') {
                dataToUpdate.status = 'PAID';
                dataToUpdate.paymentTransactionId = transactionId;
            } else if (status === 'PAYMENT_FAILURE') {
                dataToUpdate.status = 'FAILED';
                dataToUpdate.paymentTransactionId = transactionId;
                dataToUpdate.paymentFailureReason = reason;
            }

            if (dataToUpdate.status) {
                await prisma.order.update({
                    where: { id: orderId },
                    data: dataToUpdate,
                });
                console.log(`Updated order [${orderId}] status to [${dataToUpdate.status}] with transaction details.`);
            }
        }

    } catch (error) {
        console.error(`Error processing Kafka message: ${error.message}`, error);
    }
};

const connectConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topics: [PRODUCT_TOPIC, AUTH_TOPIC, PAYMENT_TOPIC], fromBeginning: true });
        console.log(`Kafka consumer subscribed to topics: [${PRODUCT_TOPIC}, ${AUTH_TOPIC}, ${PAYMENT_TOPIC}]`);

        await consumer.run({ eachMessage: processMessage });
        console.log('Kafka consumer is running...');
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