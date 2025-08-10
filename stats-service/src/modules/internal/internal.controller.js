const axios = require('axios');
const prisma = require('../../config/prisma');
const { startOfDay } = require('date-fns');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL;

const syncHistoricalData = async (req, res, next) => {
    console.log("Starting historical data backfill...");
    try {
        // 1. Clear existing analytical data
        console.log("Clearing existing analytical data...");
        await prisma.$transaction([
            prisma.factOrderItem.deleteMany(),
            prisma.factOrder.deleteMany(),
            prisma.dailyAggregate.deleteMany(),
        ]);
        console.log("Existing data cleared.");

        // 2. Fetch all orders from order-service
        let allOrders = [];
        let page = 1;
        let hasMore = true;
        console.log("Fetching paginated orders from order-service...");
        while(hasMore) {
            const response = await axios.get(`${ORDER_SERVICE_URL}?page=${page}&limit=100`);
            const orders = response.data.data;
            if (orders && orders.length > 0) {
                allOrders.push(...orders);
                page++;
            } else {
                hasMore = false;
            }
        }
        console.log(`Fetched a total of ${allOrders.length} orders.`);

        // 3. Process and save Fact tables
        console.log("Processing and saving fact tables...");
        for (const order of allOrders) {
            if (order.status === 'PENDING') continue; // Skip orders not yet finalized

            await prisma.factOrder.create({
                data: {
                    id: order.id,
                    status: order.status,
                    totalAmount: order.totalAmount,
                    countryCode: order.shippingAddress?.country || 'N/A',
                    createdAt: order.createdAt,
                    itemCount: order.items.length,
                    paymentMethod: order.paymentMethod,
                    items: {
                        create: order.items.map(item => ({
                            id: item.id,
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            price: item.priceAtTimeOfOrder,
                            lineItemTotal: parseFloat(item.priceAtTimeOfOrder) * item.quantity,
                        })),
                    },
                },
            });
        }
        console.log("Fact tables populated.");

        // 4. Recalculate daily aggregates from the new facts
        console.log("Recalculating daily aggregates...");
        const aggregates = await prisma.factOrder.groupBy({
            by: ['createdAt'],
            where: {
                status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
            },
            _sum: { totalAmount: true },
            _count: { id: true },
        });

        const dailyData = {};
        for(const agg of aggregates) {
            const date = startOfDay(new Date(agg.createdAt));
            const dateStr = date.toISOString();
            if(!dailyData[dateStr]) {
                dailyData[dateStr] = { date, totalRevenue: 0, ordersCount: 0 };
            }
            dailyData[dateStr].totalRevenue += parseFloat(agg._sum.totalAmount);
            dailyData[dateStr].ordersCount += agg._count.id;
        }

        const dailyDataArray = Object.values(dailyData);
        if (dailyDataArray.length > 0) {
            await prisma.dailyAggregate.createMany({
                data: dailyDataArray,
                skipDuplicates: true,
            });
        }

        console.log(`Daily aggregates recalculated. ${dailyDataArray.length} days populated.`);
        console.log("Historical data backfill completed successfully.");
        res.status(200).json({ message: "Sync completed", totalOrdersProcessed: allOrders.length });
    } catch (error) {
        console.error("Error during historical data sync:", error);
        next(error);
    }
};

module.exports = { syncHistoricalData };