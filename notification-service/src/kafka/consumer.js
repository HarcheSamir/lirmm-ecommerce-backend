const { Kafka, logLevel } = require('kafkajs');
const nodemailer = require('nodemailer');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka-dev:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'notification-service';
const STORE_FRONTEND_URL = process.env.STORE_FRONTEND_URL || 'http://localhost:5173';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

const kafka = new Kafka({
    clientId: `${SERVICE_NAME}-consumer`,
    brokers: KAFKA_BROKERS,
    logLevel: process.env.NODE_ENV === 'development' ? logLevel.INFO : logLevel.WARN,
    retry: { initialRetryTime: 300, retries: 5 }
});

const consumer = kafka.consumer({ groupId: `${SERVICE_NAME}-group` });
let isConnected = false;

const sendInvitationEmail = async (email, name, token) => {
    const invitationLink = `${STORE_FRONTEND_URL}/accept-invitation?token=${token}`;

    const mailOptions = {
        from: `"LIRMM E-Commerce" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'You have been invited to join LIRMM E-Commerce!',
        html: `
            <p>Hello ${name},</p>
            <p>You have been invited to create an account on the LIRMM E-Commerce platform.</p>
            <p>Please click the button below to set up your password. This link is valid for 24 hours.</p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="${invitationLink}" style="padding: 12px 25px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">Set Your Password</a>
            </p>
            <p>If you did not expect this invitation, you can safely ignore this email.</p>
        `,
        text: `Hello ${name},\nPlease visit the following link to set your password: ${invitationLink}`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Invitation email sent successfully to ${email}. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`Failed to send email to ${email} via Gmail:`, error);
    }
};

const handleMessage = async ({ topic, partition, message }) => {
    try {
        const event = JSON.parse(message.value.toString());
        if (event.type === 'USER_INVITED') {
            const { email, name, token } = event.payload;
            await sendInvitationEmail(email, name, token);
        }
    } catch (err) {
        console.error('Error processing Kafka message:', err);
    }
};

const connectConsumer = async () => {
    if (isConnected) return;
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: 'auth_events', fromBeginning: true });
        isConnected = true;
        console.log(`Kafka consumer connected and subscribed to topic 'auth_events'.`);
        console.log(`Configured to send emails via Gmail as user: ${process.env.GMAIL_USER}`);
        await consumer.run({ eachMessage: handleMessage });
    } catch (error) {
        console.error('Failed to connect Kafka consumer:', error);
        isConnected = false;
        throw error;
    }
};

const disconnectConsumer = async () => {
    if (!isConnected) return;
    try {
        await consumer.disconnect();
        isConnected = false;
        console.log('Kafka consumer disconnected.');
    } catch (error) {
        console.error('Error disconnecting Kafka consumer:', error);
    }
};

module.exports = { connectConsumer, disconnectConsumer };