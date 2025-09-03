// stats-service/src/modules/stats/stats.controller.js
const prisma = require('../../config/prisma');

const calculateChange = (current, previous) => {
    if (previous > 0) {
        return ((current - previous) / previous) * 100;
    }
    return current > 0 ? 100 : 0;
};

const getKpis = async (req, res, next) => {
    try {
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setUTCDate(today.getUTCDate() - 30);
        
        const sixtyDaysAgo = new Date(today);
        sixtyDaysAgo.setUTCDate(today.getUTCDate() - 60);

        const [lifetimeKpis, recentPeriodAggregates, previousPeriodAggregates] = await Promise.all([
            prisma.kpi.findMany(),
            prisma.dailyAggregate.aggregate({
                _sum: { newCustomers: true, newOrders: true, totalRevenue: true },
                where: { date: { gte: thirtyDaysAgo, lt: today } },
            }),
            prisma.dailyAggregate.aggregate({
                _sum: { newCustomers: true, newOrders: true, totalRevenue: true },
                where: { date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
            }),
        ]);

        const kpiMap = lifetimeKpis.reduce((acc, kpi) => {
            acc[kpi.key] = parseFloat(kpi.value);
            return acc;
        }, {});

        const recent = recentPeriodAggregates._sum;
        const previous = previousPeriodAggregates._sum;

        const customerChange = calculateChange(recent.newCustomers || 0, previous.newCustomers || 0);
        const orderChange = calculateChange(recent.newOrders || 0, previous.newOrders || 0);
        const revenueChange = calculateChange(parseFloat(recent.totalRevenue) || 0, parseFloat(previous.totalRevenue) || 0);

        res.json({
            customers: {
                value: kpiMap.totalCustomers || 0,
                change: customerChange.toFixed(2),
            },
            orders: {
                value: kpiMap.totalOrders || 0,
                change: orderChange.toFixed(2),
            },
            revenue: {
                value: kpiMap.totalRevenue || 0,
                change: revenueChange.toFixed(2),
            },
            growth: {
                value: revenueChange.toFixed(2),
            },
        });

    } catch (err) {
        next(err);
    }
};

const getRevenueTimeSeries = async (req, res, next) => {
    try {
        const now = new Date();
        const lastMonth = now.getUTCMonth(); 
        const yearForLastMonth = now.getUTCFullYear();
        
        const startDateThisPeriod = new Date(Date.UTC(yearForLastMonth, lastMonth - 11, 1)); 
        
        const data = await prisma.monthlyAggregate.findMany({
            where: {
                OR: [
                    { year: { gte: startDateThisPeriod.getUTCFullYear() - 1 } },
                ]
            },
            orderBy: [{ year: 'asc' }, { month: 'asc' }]
        });
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let result = [];

        for (let i = 0; i < 12; i++) {
            let date = new Date(startDateThisPeriod);
            date.setUTCMonth(startDateThisPeriod.getUTCMonth() + i);

            let currentYear = date.getUTCFullYear();
            let currentMonth = date.getUTCMonth() + 1;
            let lastYear = currentYear - 1;

            const thisYearData = data.find(d => d.year === currentYear && d.month === currentMonth);
            const lastYearData = data.find(d => d.year === lastYear && d.month === currentMonth);

            result.push({
                name: monthNames[date.getUTCMonth()],
                expenses: parseFloat(thisYearData?.totalExpenses || 0),
                revenueThisYear: parseFloat(thisYearData?.totalRevenue || 0),
                revenueLastYear: parseFloat(lastYearData?.totalRevenue || 0),
            });
        }
        
        res.json(result);
    } catch (err) {
        next(err);
    }
};

const getTopSellingProducts = async (req, res, next) => {
    try {
        const lang = req.headers['accept-language']?.split(',')[0].substring(0, 2) || 'en';
        const limit = parseInt(req.query.limit, 10) || 5;

        const products = await prisma.productPerformance.findMany({
            take: limit,
            orderBy: {
                totalRevenueGenerated: 'desc'
            }
        });

        const formattedProducts = products.map(p => ({
            name: p.productName[lang] || p.productName['en'],
            attributes: p.variantAttributes,
            quantity: p.totalQuantitySold,
            amount: parseFloat(p.totalRevenueGenerated)
        }));

        res.json(formattedProducts);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getKpis,
    getRevenueTimeSeries,
    getTopSellingProducts,
};