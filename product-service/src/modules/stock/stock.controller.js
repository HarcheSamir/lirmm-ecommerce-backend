const prisma = require('../../config/prisma');
const { sendMessage } = require('../../kafka/producer');
const { Prisma } = require('@prisma/client');
// Import the helper function (adjust path if needed)
const { fetchAndFormatProductForKafka } = require('../product/product.controller');


// Adjust stock for a specific variant
const adjustStock = async (req, res, next) => {
    try {
        const { variantId } = req.params;
        const { changeQuantity, type, reason, relatedOrderId } = req.body;

        if (changeQuantity === undefined || !type) {
             return res.status(400).json({ message: 'changeQuantity and type are required.' });
         }
        const quantity = parseInt(changeQuantity, 10);
         if (isNaN(quantity)) {
             return res.status(400).json({ message: 'changeQuantity must be an integer.' });
         }
        const validTypes = Object.values(Prisma.StockMovementType);
        if (!validTypes.includes(type)) {
             return res.status(400).json({ message: `Invalid stock movement type. Valid types are: ${validTypes.join(', ')}` });
        }

        let productId = null; // To store the product ID

        // Use transaction
        const result = await prisma.$transaction(async (tx) => {
            const variant = await tx.variant.findUnique({
                 where: { id: variantId },
                 select: { stockQuantity: true, productId: true } // Select productId
            });
            if (!variant) { throw new Error('VariantNotFound'); }

            productId = variant.productId; // Store product ID

            const currentStock = variant.stockQuantity;
            const newStock = currentStock + quantity;
            if (quantity < 0 && newStock < 0) { throw new Error('InsufficientStock'); }

            const movement = await tx.stockMovement.create({
                data: { variantId, changeQuantity: quantity, type, reason, relatedOrderId }
            });
            const updatedVariant = await tx.variant.update({
                where: { id: variantId }, data: { stockQuantity: newStock }
            });
            return { movement, updatedVariant };
        });

        // --- Send Kafka Event AFTER successful transaction ---
        // Send PRODUCT_UPDATED for the parent product as stock change might affect searchability (e.g., isActive status, stock filters)
        if (productId) { // Ensure we got the product ID
            const kafkaPayload = await fetchAndFormatProductForKafka(productId);
            if (kafkaPayload) {
                await sendMessage('PRODUCT_UPDATED', kafkaPayload, productId);
            }
        } else {
            console.error(`[Stock Adjust] Could not determine productId for variant ${variantId} to send Kafka update.`);
        }
        // --- End Kafka Event ---

        res.status(201).json({
             message: `Stock adjusted successfully for variant ${variantId}.`,
             movement: result.movement,
             newStockQuantity: result.updatedVariant.stockQuantity,
         });

    } catch (err) {
        if (err.message === 'VariantNotFound') {
             return res.status(404).json({ message: `Variant with ID ${req.params.variantId} not found.` });
         }
        if (err.message === 'InsufficientStock') {
             return res.status(400).json({ message: 'Insufficient stock for the requested decrease.' });
         }
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
            return res.status(404).json({ message: `Variant with ID ${req.params.variantId} not found.` });
        }
        next(err);
    }
};

// Keep original get method
const getStockMovements = async (req, res, next) => { /* ... original code ... */ };

module.exports = {
    adjustStock,
    getStockMovements,
};