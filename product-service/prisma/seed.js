const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const currencyData = [
    { code: 'USD', rateVsBase: 1.0, isBase: true },
    { code: 'EUR', rateVsBase: 0.92, isBase: false },
    { code: 'DZD', rateVsBase: 135.50, isBase: false },
];

async function main() {
    console.log('Starting Prisma seed...');

    // --- Seed Currency Rates ---
    console.log('Seeding currency rates...');
    for (const currency of currencyData) {
        await prisma.currencyRate.upsert({
            where: { code: currency.code },
            update: { rateVsBase: currency.rateVsBase, isBase: currency.isBase },
            create: currency,
        });
    }
    console.log('Currency rates seeded successfully.');

    // Add other seeding logic here if needed in the future (e.g., seeding initial products/categories)

    console.log('Prisma seed finished.');
}

main()
    .catch((e) => {
        console.error('An error occurred during Prisma seeding:');
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });