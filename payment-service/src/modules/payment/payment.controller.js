const { sendMessage } = require('../../kafka/producer');
const { v4: uuidv4 } = require('uuid');

const processPayment = async (req, res, next) => {
    const { orderId, amount, userEmail } = req.body;

    if (!orderId || !amount) {
        return res.status(400).json({ message: 'orderId and amount are required.' });
    }

    // Immediately respond to the caller to not block the order service
    res.status(202).json({
        message: 'Payment processing initiated.',
        orderId: orderId,
    });

    // Simulate network delay and processing time of a real payment gateway
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate a 90% success rate
    const isSuccess = Math.random() < 0.9;
    const transactionId = uuidv4();

    if (isSuccess) {
        console.log(`Payment for order [${orderId}] succeeded. Transaction ID: ${transactionId}`);
        await sendMessage('PAYMENT_SUCCESS', {
            orderId,
            transactionId,
            amount,
            status: 'PAYMENT_SUCCESS',
        });
    } else {
        const failureReason = 'Insufficient funds';
        console.log(`Payment for order [${orderId}] failed. Reason: ${failureReason}`);
        await sendMessage('PAYMENT_FAILURE', {
            orderId,
            transactionId,
            amount,
            status: 'PAYMENT_FAILURE',
            reason: failureReason,
        });
    }
};

module.exports = {
    processPayment,
};