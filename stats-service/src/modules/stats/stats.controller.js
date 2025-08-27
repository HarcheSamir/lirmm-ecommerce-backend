// stats-service/src/modules/stats/stats.controller.js
const prisma = require('../../config/prisma');
const { subDays, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, format, getMonth, getYear } = require('date-fns');

const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100.0 : 0.0;
    const change = ((current - previous) / previous) * 100;
    return isNaN(change) ? 0.0 : change;
};

const getKpis = async (req, res, next) => {
    try {
        const now = new Date();
        const currentPeriodStart = subDays(now, 29);
        const previousPeriodStart = subDays(now, 59);
        const previousPeriodEnd = subDays(now, 30);

        const [totalCustomersResult, currentPeriodData, previousPeriodData] = await Promise.all([
            // CORRECTED QUERY: Sum from its own aggregated data, not from a foreign table.
            prisma.dailyAggregate.aggregate({
                _sum: { newCustomerCount: true },
            }),
            prisma.dailyAggregate.aggregate({
                _sum: { revenue: true, cogs: true, orderCount: true, newCustomerCount: true },
                where: { date: { gte: currentPeriodStart, lte: now } },
            }),
            prisma.dailyAggregate.aggregate({
                _sum: { revenue: true, cogs: true, orderCount: true, newCustomerCount: true },
                where: { date: { gte: previousPeriodStart, lte: previousPeriodEnd } },
            })
        ]);
        
        const totalCustomers = totalCustomersResult._sum.newCustomerCount || 0;

        const currentRevenue = Number(currentPeriodData._sum.revenue) || 0;
        const previousRevenue = Number(previousPeriodData._sum.revenue) || 0;
        const currentOrders = currentPeriodData._sum.orderCount || 0;
        const previousOrders = previousPeriodData._sum.orderCount || 0;
        const currentNewCustomers = currentPeriodData._sum.newCustomerCount || 0;
        const previousNewCustomers = previousPeriodData._sum.newCustomerCount || 0;

        const currentGrossProfit = currentRevenue - (Number(currentPeriodData._sum.cogs) || 0);
        const previousGrossProfit = previousRevenue - (Number(previousPeriodData._sum.cogs) || 0);
        
        const profitGrowthRate = calculateChange(currentGrossProfit, previousGrossProfit);

        res.json({
            customers: {
                value: totalCustomers,
                change: calculateChange(currentNewCustomers, previousNewCustomers).toFixed(2)
            },
            orders: {
                value: currentOrders,
                change: calculateChange(currentOrders, previousOrders).toFixed(2)
            },
            revenue: {
                value: currentRevenue,
                change: calculateChange(currentRevenue, previousRevenue).toFixed(2)
            },
            growth: {
                value: profitGrowthRate.toFixed(1),
                change: "0.00" 
            }
        });

    } catch (err) { next(err); }
};

const getRevenueCogsOverTime = async (req, res, next) => {
    try {
        const now = new Date();
        const lastMonth = subMonths(now, 1);
        const sixMonthsAgo = startOfMonth(subMonths(now, 6));

        const data = await prisma.$queryRaw`
            SELECT 
                DATE_TRUNC('month', date)::DATE as month,
                SUM(revenue) as revenue,
                SUM(cogs) as cogs
            FROM "daily_aggregates"
            WHERE date >= ${sixMonthsAgo} AND date <= ${endOfMonth(lastMonth)}
            GROUP BY month
            ORDER BY month ASC;
        `;
        
        const formattedData = data.map(row => ({
            name: format(new Date(row.month), 'MMM'),
            revenue: parseFloat(row.revenue),
            spendings: parseFloat(row.cogs)
        }));

        res.json(formattedData);
    } catch (err) { next(err); }
};

const getRevenueYoY = async (req, res, next) => {
    try {
        const now = new Date();
        const lastFullMonth = endOfMonth(subMonths(now, 1));
        
        const currentYearStart = startOfMonth(subMonths(now, 6));
        const lastYearStart = subMonths(currentYearStart, 12);
        const lastYearEnd = endOfMonth(subMonths(now, 13));
        
        const [currentYearData, lastYearData] = await Promise.all([
             prisma.$queryRaw`
                SELECT DATE_TRUNC('month', date)::DATE as month, SUM(revenue) as total FROM "daily_aggregates"
                WHERE date >= ${currentYearStart} AND date <= ${lastFullMonth} GROUP BY month ORDER BY month`,
             prisma.$queryRaw`
                SELECT DATE_TRUNC('month', date)::DATE as month, SUM(revenue) as total FROM "daily_aggregates"
                WHERE date >= ${lastYearStart} AND date <= ${lastYearEnd} GROUP BY month ORDER BY month`,
        ]);

        const lastYearMap = new Map(lastYearData.map(d => [getMonth(new Date(d.month)), parseFloat(d.total)]));

        const response = currentYearData.map(d => {
            const monthDate = new Date(d.month);
            const month = getMonth(monthDate);
            return {
                name: format(monthDate, 'MMM'),
                current: parseFloat(d.total),
                previous: lastYearMap.get(month) || 0
            };
        });

        res.json(response);

    } catch (err) { next(err); }
};

const getRevenueWoW = async (req, res, next) => {
    try {
        const now = new Date();
        const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });
        const startOfPreviousWeek = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const endOfPreviousWeek = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

        const [currentWeekData, previousWeekData] = await Promise.all([
            prisma.dailyAggregate.aggregate({
                _sum: { revenue: true },
                where: { date: { gte: startOfCurrentWeek, lte: endOfCurrentWeek } },
            }),
            prisma.dailyAggregate.aggregate({
                _sum: { revenue: true },
                where: { date: { gte: startOfPreviousWeek, lte: endOfPreviousWeek } },
            })
        ]);

        res.json({
            currentWeekRevenue: Number(currentWeekData._sum.revenue) || 0,
            previousWeekRevenue: Number(previousWeekData._sum.revenue) || 0
        });

    } catch (err) { next(err); }
};

const getTopProducts = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const products = await prisma.productPerformance.findMany({
            orderBy: { totalRevenueGenerated: 'desc' },
            take: limit
        });

        const formattedProducts = products.map(p => ({
            name: p.productName,
            price: (p.totalUnitsSold > 0 ? (Number(p.totalRevenueGenerated) / p.totalUnitsSold) : 0).toFixed(2),
            quantity: p.totalUnitsSold,
            amount: Number(p.totalRevenueGenerated).toFixed(2)
        }));

        res.json(formattedProducts);
    } catch (err) { next(err); }
};

module.exports = {
    getKpis,
    getRevenueCogsOverTime,
    getRevenueYoY,
    getRevenueWoW,
    getTopProducts
};