// product-service/src/modules/stock/stock.controller.js
const prisma = require('../../config/prisma');
const { sendMessage } = require('../../kafka/producer');
const { fetchAndFormatProductForKafka } = require('../product/product.controller');

const performStockAdjustment = async (variantId, quantity, type, reason, relatedOrderId, timestamp) => {
    let productId = null;
    const result = await prisma.$transaction(async (tx) => {
        const variant = await tx.variant.findUnique({
             where: { id: variantId },
             select: { stockQuantity: true, productId: true }
        });
        if (!variant) { throw new Error('VariantNotFound'); }

        productId = variant.productId;

        const currentStock = variant.stockQuantity;
        const newStock = currentStock + quantity;
        if (quantity < 0 && newStock < 0) { throw new Error('InsufficientStock'); }

        const movement = await tx.stockMovement.create({
            data: {
                variantId,
                changeQuantity: quantity,
                type,
                reason,
                relatedOrderId,
                timestamp: timestamp ? new Date(timestamp) : undefined
            }
        });
        const updatedVariant = await tx.variant.update({
            where: { id: variantId }, data: { stockQuantity: newStock }
        });
        return { movement, updatedVariant };
    });

    if (productId) {
        const kafkaPayload = await fetchAndFormatProductForKafka(productId);
        if (kafkaPayload) {
            await sendMessage('PRODUCT_UPDATED', kafkaPayload, productId);
        }
    }
    return result;
};

const reverseStockForOrder = async (order) => {
    return prisma.$transaction(async (tx) => {
        const existingMovements = await tx.stockMovement.findMany({
            where: { relatedOrderId: order.id, type: 'ORDER' }
        });

        if (existingMovements.length === 0) {
            console.log(`No stock movements found for order ${order.id} to reverse. Skipping.`);
            return;
        }

        for (const item of order.items) {
            const movement = existingMovements.find(m => m.variantId === item.variantId);
            if (!movement) continue;

            // Check if a reversal already exists to prevent double-reversal
            const reversalExists = await tx.stockMovement.count({
                where: { relatedOrderId: order.id, type: 'ORDER_CANCELLED', variantId: item.variantId }
            });

            if (reversalExists > 0) {
                console.log(`Reversal for variant ${item.variantId} on order ${order.id} already exists. Skipping.`);
                continue;
            }

            await performStockAdjustment(
                item.variantId,
                -movement.changeQuantity, // Reverse the quantity
                'ORDER_CANCELLED',
                `Order cancellation: ${order.id}`,
                order.id,
                new Date()
            );
        }
        console.log(`Stock reversal completed for order ${order.id}`);
    });
};

const adjustStock = async (req, res, next) => {
    try {
        const { variantId } = req.params;
        const { changeQuantity, type, reason, relatedOrderId, timestamp } = req.body;

        if (changeQuantity === undefined || !type) {
             return res.status(400).json({ message: 'changeQuantity and type are required.' });
        }
        const quantity = parseInt(changeQuantity, 10);
         if (isNaN(quantity)) {
             return res.status(400).json({ message: 'changeQuantity must be an integer.' });
        }

        const result = await performStockAdjustment(variantId, quantity, type, reason, relatedOrderId, timestamp);

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
        if (err.code === 'P2003' || err.message?.includes("invalid input value for enum")) {
            return res.status(400).json({ message: `Invalid 'type' provided for stock movement.` });
        }
        if (err.code === 'P2025') {
             return res.status(404).json({ message: 'Variant not found.' });
        }
        next(err);
    }
};

const getStockMovements = async (req, res, next) => {
    try {
        const { variantId } = req.params;
        const movements = await prisma.stockMovement.findMany({
            where: { variantId },
            orderBy: { timestamp: 'desc' },
        });
        res.json(movements);
    } catch (err) {
        next(err);
    }
 };

module.exports = {
    adjustStock,
    getStockMovements,
    performStockAdjustment,
    reverseStockForOrder
};