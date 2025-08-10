const prisma = require('../../config/prisma');
const { subDays, startOfMonth, endOfMonth, eachMonthOfInterval, format } = require('date-fns');
const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

// KPI Cards
const getKpis = async (req, res, next) => {
    try {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);
        const sixtyDaysAgo = subDays(today, 60);

        // Current period stats
        const currentPeriodData = await prisma.dailyAggregate.aggregate({
            _sum: { totalRevenue: true, newCustomersCount: true, ordersCount: true },
            where: { date: { gte: thirtyDaysAgo } },
        });

        // Previous period stats for comparison
        const previousPeriodData = await prisma.dailyAggregate.aggregate({
            _sum: { totalRevenue: true },
            where: { date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        });

        // --- THIS IS THE FIX ---
        // Fetch total customer count from the new, unprotected internal endpoint
        const usersResponse = await axios.get(`${AUTH_SERVICE_URL}/users/internal/total-count`);
        const totalCustomers = usersResponse.data.total;
        // --- END OF FIX ---

        const calcChange = (current, previous) => {
            if (previous === 0 || previous == null) return current > 0 ? 1 : 0; // 100% increase or no change
            return (current - previous) / previous;
        };

        const revenue = parseFloat(currentPeriodData._sum.totalRevenue || 0);
        const prevRevenue = parseFloat(previousPeriodData._sum.totalRevenue || 0);
        
        res.json({
            customers: { total: totalCustomers, change: null }, // Change for customers is complex, omitted for now
            orders: { total: currentPeriodData._sum.ordersCount || 0, change: null },
            revenue: { total: revenue, change: calcChange(revenue, prevRevenue) },
            growth: { value: null, change: null }, // Requires business logic for projections
        });

    } catch (error) { next(error); }
};

// ... (all other functions in this file remain unchanged) ...
const getRevenueOverTime = async (req, res, next) => {
    try {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);
        
        const revenueData = await prisma.dailyAggregate.findMany({
            where: { date: { gte: thirtyDaysAgo } },
            orderBy: { date: 'asc' },
        });

        res.json(revenueData.map(d => ({
            date: format(d.date, 'yyyy-MM-dd'),
            revenue: parseFloat(d.totalRevenue)
        })));
    } catch (error) { next(error); }
};

const getTopProducts = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const topProducts = await prisma.factOrderItem.groupBy({
            by: ['productId', 'productName'],
            _sum: {
                quantity: true,
                lineItemTotal: true,
            },
            orderBy: {
                _sum: { quantity: 'desc' },
            },
            take: limit,
        });

        res.json(topProducts.map(p => ({
            productId: p.productId,
            productName: p.productName,
            totalQuantitySold: p._sum.quantity || 0,
            totalRevenue: parseFloat(p._sum.lineItemTotal || 0),
        })));
    } catch (error) { next(error); }
};

const getRevenueByCountry = (req, res, next) => {
    const hardcodedData = [
      { countryName: "United States", countryCode: "USA", totalRevenue: 72000.00 },
      { countryName: "Australia", countryCode: "AUS", totalRevenue: 25000.00 },
      { countryName: "Singapore", countryCode: "SGP", totalRevenue: 61000.00 },
      { countryName: "Brazil", countryCode: "BRA", totalRevenue: 45000.00 },
      { countryName: "United Kingdom", countryCode: "GBR", totalRevenue: 55000.00 },
    ];
    res.json(hardcodedData);
};

const getProjectionsVsActuals = async (req, res, next) => {
    try {
        const sixMonthsAgo = startOfMonth(subDays(new Date(), 180));
        
        const monthlyActuals = await prisma.factOrder.groupBy({
            by: ['createdAt'],
            where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }, createdAt: { gte: sixMonthsAgo } },
            _sum: { totalAmount: true },
        });

        const result = {};
        monthlyActuals.forEach(agg => {
            const month = format(agg.createdAt, 'yyyy-MM');
            if(!result[month]) result[month] = 0;
            result[month] += parseFloat(agg._sum.totalAmount);
        });

        const finalData = Object.keys(result).map(monthStr => {
            const actuals = result[monthStr];
            const projection = actuals * 1.15;
            return {
                name: format(new Date(monthStr), 'MMM'),
                actuals: parseFloat(actuals.toFixed(2)),
                projection: parseFloat(projection.toFixed(2)),
            }
        });

        res.json(finalData);
    } catch (error) { next(error); }
};

const getSalesByPaymentMethod = async (req, res, next) => {
    try {
        const salesData = await prisma.factOrder.groupBy({
            by: ['paymentMethod'],
            where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
            _sum: {
                totalAmount: true,
            },
        });
        
        res.json(salesData.map(d => ({
            name: d.paymentMethod.replace(/_/g, ' '),
            value: parseFloat(d._sum.totalAmount || 0),
        })));

    } catch (error) { next(error); }
};


module.exports = {
    getKpis,
    getRevenueOverTime,
    getTopProducts,
    getRevenueByCountry,
    getProjectionsVsActuals,
    getSalesByPaymentMethod,
};