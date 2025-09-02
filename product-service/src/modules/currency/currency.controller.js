const prisma = require('../../config/prisma');

const getRates = async (req, res, next) => {
    try {
        const rates = await prisma.currencyRate.findMany();
        res.json(rates);
    } catch (err) {
        next(err);
    }
};

const getRateByCode = async (req, res, next) => {
    try {
        const { code } = req.params;
        const rate = await prisma.currencyRate.findUnique({ where: { code: code.toUpperCase() } });
        if (!rate) {
            return res.status(404).json({ message: `Currency rate for code '${code}' not found.` });
        }
        res.json(rate);
    } catch (err) {
        next(err);
    }
};

const upsertRate = async (req, res, next) => {
    try {
        const { code, rateVsBase, isBase } = req.body;
        if (!code || rateVsBase === undefined) {
            return res.status(400).json({ message: '`code` and `rateVsBase` are required.' });
        }

        const upperCaseCode = code.toUpperCase();

        const rate = await prisma.currencyRate.upsert({
            where: { code: upperCaseCode },
            update: { rateVsBase, isBase },
            create: { code: upperCaseCode, rateVsBase, isBase }
        });

        res.status(200).json(rate);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getRates,
    getRateByCode,
    upsertRate,
};