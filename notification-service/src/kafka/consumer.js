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

const sendEmail = async (mailOptions) => {
    const email = mailOptions.to;
    if (email.toLowerCase().includes("test") ) {
        console.log(`Skipping email to ${email} (contains "test").`);
        return;
    }
    try {
        const info = await transporter.sendMail({
            from: `"LIRMM E-Commerce" <${process.env.GMAIL_USER}>`,
            ...mailOptions
        });
        console.log(`Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
    }
};

const sendInvitationEmail = async (email, name, token) => {
    const invitationLink = `${STORE_FRONTEND_URL}/accept-invitation?token=${token}`;
    const mailOptions = {
        to: email,
        subject: 'You have been invited to join LIRMM E-Commerce!',
        html: `<p>Hello ${name},</p><p>You have been invited to create an account on the LIRMM E-Commerce platform.</p><p>Please click the button below to set up your password. This link is valid for 24 hours.</p><p style="text-align: center; margin: 20px 0;"><a href="${invitationLink}" style="padding: 12px 25px; background-color: #007bff; color: white; text-decoration: none;border-radius: 5px; font-size: 16px;">Set Your Password</a></p><p>If you did not expect this invitation, you can safely ignore this email.</p>`,
        text: `Hello ${name},\nPlease visit the following link to set your password: ${invitationLink}`
    };
    await sendEmail(mailOptions);
};

const sendOrderConfirmationEmail = async (order) => {
    const { customerEmail, id, guest_token } = order;
    const orderTrackingLink = guest_token ? `${STORE_FRONTEND_URL}/track-order?orderId=${id}&token=${guest_token}` : `${STORE_FRONTEND_URL}/account/orders`;
    await sendEmail({
        to: customerEmail,
        subject: `Your LIRMM E-Commerce Order #${id.substring(0, 8)} is Confirmed!`,
        html: `<p>Thank you for your order!</p><p>You can view your order details or cancel it by visiting the link below:</p><p><a href="${orderTrackingLink}">${orderTrackingLink}</a></p>`,
    });
};

const sendOrderCancelledEmail = async (order) => {
    const { customerEmail, id } = order;
    await sendEmail({
        to: customerEmail,
        subject: `Your LIRMM E-Commerce Order #${id.substring(0, 8)} has been cancelled.`,
        html: `<p>Your order #${id.substring(0, 8)} has been successfully cancelled.</p><p>If this was a paid order, a refund has been initiated.</p>`,
    });
};

const sendReturnRequestReceivedEmail = async (request) => {
    const { customerEmail, id, orderId } = request;
    await sendEmail({
        to: customerEmail,
        subject: `We've Received Your Return Request #${id.substring(0,8)}`,
        html: `<p>Hello,</p><p>We have successfully received your return request for order #${orderId.substring(0,8)}.</p><p>Our team will review it within 24-48 hours and you will be notified of the next steps.</p>`,
    });
};

const sendReturnRequestApprovedEmail = async (request) => {
    const { customerEmail, id, orderId } = request;
    await sendEmail({
        to: customerEmail,
        subject: `Your Return Request #${id.substring(0,8)} has been Approved`,
        html: `<p>Hello,</p><p>Good news! Your return request for order #${orderId.substring(0,8)} has been approved.</p><p>Please follow the instructions provided on our returns page and ship the item(s) back to us.</p>`,
    });
};

const sendReturnRequestRejectedEmail = async (request) => {
    const { customerEmail, id, orderId, adminComments } = request;
    await sendEmail({
        to: customerEmail,
        subject: `Update on Your Return Request #${id.substring(0,8)}`,
        html: `<p>Hello,</p><p>We have reviewed your return request for order #${orderId.substring(0,8)}.</p><p>Unfortunately, we are unable to accept this return at this time.</p><p><b>Reason:</b> ${adminComments || 'Please contact support for more details.'}</p>`,
    });
};

const sendReturnCompletedEmail = async (request) => {
    const { customerEmail, id, orderId } = request;
    await sendEmail({
        to: customerEmail,
        subject: `Your Return for Order #${orderId.substring(0,8)} is Complete`,
        html: `<p>Hello,</p><p>We have received your returned item(s) and your return is now complete.</p><p>A refund has been issued to your original payment method.</p>`,
    });
};

const sendReturnCommentAddedEmail = async (payload) => {
    const { returnRequest, authorName, commentText, imageUrl } = payload;
    const { customerEmail, id, orderId, guest_token } = returnRequest;
    
    const viewRequestLink = guest_token ? `${STORE_FRONTEND_URL}/track-order?orderId=${orderId}&token=${guest_token}&returnFocus=true` : `${STORE_FRONTEND_URL}/account/orders`;
    
    // --- START: SURGICAL CORRECTION ---
    let commentHtml = '';
    if (commentText) {
        commentHtml += `<p><b>${authorName}:</b> "${commentText}"</p>`;
    }
    if (imageUrl) {
        commentHtml += `<p><i>An image was attached. You can view it by clicking the link below.</i></p>`;
    }
    // --- END: SURGICAL CORRECTION ---

    await sendEmail({
        to: customerEmail,
        subject: `New Comment on Your Return Request #${id.substring(0,8)}`,
        html: `<p>Hello,</p><p>A new comment has been added to your return request for order #${orderId.substring(0,8)}.</p>
               ${commentHtml}
               <p>You can view the full conversation and reply by clicking the link below:</p>
               <p><a href="${viewRequestLink}">View Return Request</a></p>`,
    });
};


const handleMessage = async ({ topic, partition, message }) => {
    try {
        const event = JSON.parse(message.value.toString());
        
        if (topic === 'auth_events' && event.type === 'USER_INVITED') {
            const { email, name, token } = event.payload;
            await sendInvitationEmail(email, name, token);
        }
        else if (topic === 'order_events') {
            console.log(`Processing event of type [${event.type}] from topic [order_events]`);
            switch(event.type) {
                case 'ORDER_CREATED': await sendOrderConfirmationEmail(event.payload); break;
                case 'ORDER_CANCELLED': await sendOrderCancelledEmail(event.payload); break;
                case 'RETURN_REQUEST_CREATED': await sendReturnRequestReceivedEmail(event.payload); break;
                case 'RETURN_REQUEST_APPROVED': await sendReturnRequestApprovedEmail(event.payload); break;
                case 'RETURN_REQUEST_REJECTED': await sendReturnRequestRejectedEmail(event.payload); break;
                case 'RETURN_REQUEST_COMPLETED': await sendReturnCompletedEmail(event.payload); break;
                case 'RETURN_REQUEST_COMMENT_ADDED': await sendReturnCommentAddedEmail(event.payload); break;
            }
        }
    } catch (err) {
        console.error('Error processing Kafka message:', err);
    }
};

const connectConsumer = async () => {
    if (isConnected) return;
    try {
        await consumer.connect();
        await consumer.subscribe({ topics: ['auth_events', 'order_events'], fromBeginning: true });
        isConnected = true;
        console.log(`Kafka consumer connected and subscribed to topics: ['auth_events', 'order_events'].`);
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