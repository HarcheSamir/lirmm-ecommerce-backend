const prisma = require('../../config/prisma');
const { sendMessage } = require('../../kafka/producer');
const { Prisma } = require('@prisma/client');
// Import the helper function (adjust path if needed)
const { fetchAndFormatProductForKafka } = require('../product/product.controller');

// Add a variant to an existing product
const addVariant = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { attributes, price, costPrice, initialStockQuantity, lowStockThreshold } = req.body;

        if (!attributes || price === undefined) {
            return res.status(400).json({ message: 'Attributes and Price are required for a variant.' });
        }

        const variant = await prisma.$transaction(async (tx) => {
            const newVariant = await tx.variant.create({
                 data: {
                     productId: productId, attributes: attributes || {},
                     price: new Prisma.Decimal(price),
                     costPrice: costPrice ? new Prisma.Decimal(costPrice) : null,
                     stockQuantity: 0, lowStockThreshold: lowStockThreshold
                 }
             });
             if (initialStockQuantity && initialStockQuantity > 0) {
                 await tx.stockMovement.create({
                     data: { variantId: newVariant.id, changeQuantity: initialStockQuantity, type: 'INITIAL_STOCK', reason: 'Variant Creation Initial Stock' }
                 });
                 await tx.variant.update({ where: { id: newVariant.id }, data: { stockQuantity: initialStockQuantity } });
             }
             return newVariant;
        });

        // --- Send Kafka Event AFTER transaction ---
        // Send PRODUCT_UPDATED for the parent product
        const kafkaPayload = await fetchAndFormatProductForKafka(productId);
        if (kafkaPayload) {
            await sendMessage('PRODUCT_UPDATED', kafkaPayload, productId);
        }
        // --- End Kafka Event ---

        res.status(201).json(variant); // Return the created variant

    } catch (err) {
         if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
            return res.status(404).json({ message: `Product with ID ${req.params.productId} not found.` });
        }
        next(err);
    }
};

// Update a specific variant
const updateVariant = async (req, res, next) => {
    try {
        const { variantId } = req.params;
        const { attributes, price, costPrice, lowStockThreshold } = req.body;

        const dataToUpdate = {};
        if (attributes !== undefined) dataToUpdate.attributes = attributes;
        if (price !== undefined) dataToUpdate.price = new Prisma.Decimal(price);
        if (costPrice !== undefined) dataToUpdate.costPrice = costPrice ? new Prisma.Decimal(costPrice) : null;
        if (lowStockThreshold !== undefined) dataToUpdate.lowStockThreshold = lowStockThreshold;

        if (Object.keys(dataToUpdate).length === 0) {
             return res.status(400).json({ message: 'No valid fields provided for update.' });
         }

        // Update the variant and fetch its productId in the same query
        const updatedVariant = await prisma.variant.update({
            where: { id: variantId },
            data: dataToUpdate,
            select: { id: true, productId: true } // Select productId needed for Kafka update
        });

        // --- Send Kafka Event AFTER update ---
        // Send PRODUCT_UPDATED for the parent product
        const kafkaPayload = await fetchAndFormatProductForKafka(updatedVariant.productId);
         if (kafkaPayload) {
             await sendMessage('PRODUCT_UPDATED', kafkaPayload, updatedVariant.productId);
         }
        // --- End Kafka Event ---

        // Fetch the full variant data for the response if needed, or just return success/ID
        const fullVariant = await prisma.variant.findUnique({ where: { id: variantId } });
        res.json(fullVariant);

    } catch (err) {
         // Handle case where variant doesn't exist (P2025)
         if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
             return res.status(404).json({ message: 'Variant not found.' });
         }
        next(err);
    }
};

// Delete a specific variant
const deleteVariant = async (req, res, next) => {
    try {
        const { variantId } = req.params;

        // Find the variant first to get the productId for the Kafka message
        const variantToDelete = await prisma.variant.findUnique({
             where: { id: variantId },
             select: { id: true, productId: true }
         });

        if (!variantToDelete) {
             return res.status(404).json({ message: 'Variant not found' });
        }
        const productId = variantToDelete.productId; // Store productId

        // Deletion might fail if StockMovements exist due to `onDelete: Restrict`
        await prisma.variant.delete({
            where: { id: variantId },
        });

        // --- Send Kafka Event AFTER deletion ---
        // Send PRODUCT_UPDATED for the parent product
        const kafkaPayload = await fetchAndFormatProductForKafka(productId);
        if (kafkaPayload) { // Product might be gone if deletion cascaded, check payload
            await sendMessage('PRODUCT_UPDATED', kafkaPayload, productId);
        }
        // --- End Kafka Event ---

        res.status(204).end();
    } catch (err) {
         if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === 'P2003' || err.code === 'P2014')) {
             return res.status(409).json({ message: 'Cannot delete variant with existing stock movements.', code: err.code });
         }
          // Handle case where variant doesn't exist (P2025) - though checked above
         if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
             return res.status(404).json({ message: 'Variant not found.' });
         }
        next(err);
    }
};

// Keep original get methods
const getVariantsByProduct = async (req, res, next) => { /* ... original code ... */ };
const getVariantById = async (req, res, next) => { /* ... original code ... */ };

module.exports = {
    addVariant,
    getVariantsByProduct,
    getVariantById,
    updateVariant,
    deleteVariant,
};