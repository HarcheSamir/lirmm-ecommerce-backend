const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- Data to be seeded ---

const currencyData = [
    { code: 'USD', rateVsBase: 1.0, isBase: true },
    { code: 'EUR', rateVsBase: 0.92, isBase: false },
    { code: 'DZD', rateVsBase: 135.50, isBase: false },
];

const promotionData = [
    {
        "id": "1da6ce8b-7fed-47df-84fa-f007f301a882",
        "title": {
            "ar": "مروحة فيلي",
            "en": "Felly Fan",
            "fr": "Ventilateur Felly"
        },
        "subtitle": {
            "ar": "الصيف بلا هواء قد فقد نسمته",
            "en": "The summer without wind has lost the whole world",
            "fr": "L’été sans vent a perdu toute sa brise"
        },
        "tagline": {
            "ar": "أجهزة كهربائية",
            "en": "Appliances",
            "fr": "Appareils électroménagers"
        },
        "ctaText": {
            "ar": "تسوّق الآن",
            "en": "Shop Now",
            "fr": "Acheter maintenant"
        },
        "ctaLink": "http://localhost:5173/shop/all",
        "imageUrl": "https://i.imgur.com/W4jGDlB.png",
        "productImageUrl": null,
        "expiresAt": null,
        "isActive": true,
        "displayOrder": 0,
        "createdAt": "2025-09-02T19:41:22.777Z",
        "updatedAt": "2025-09-02T19:41:32.591Z"
    },
    {
        "id": "b0c0ae50-7a3b-4288-8376-3a14a36cc17c",
        "title": {
            "ar": "كرسي صالون",
            "en": "Salon Chair",
            "fr": "Chaise de salon"
        },
        "subtitle": {
            "ar": "راحة تُعرّف الأناقة",
            "en": "Comfort that defines elegance",
            "fr": "Un confort qui définit l’élégance"
        },
        "tagline": {
            "ar": "أثاث",
            "en": "Furniture",
            "fr": "Mobilier"
        },
        "ctaText": {
            "ar": "تسوّق الآن",
            "en": "Shop Now",
            "fr": "Acheter maintenant"
        },
        "ctaLink": "http://localhost:5173/shop/all",
        "imageUrl": "https://i.imgur.com/KPKP2N4.png",
        "productImageUrl": null,
        "expiresAt": null,
        "isActive": true,
        "displayOrder": 0,
        "createdAt": "2025-09-02T19:46:21.364Z",
        "updatedAt": "2025-09-02T19:46:23.488Z"
    },
    {
        "id": "eb4fa6be-8e25-4fb5-a9f4-bd1f30fe00fc",
        "title": {
            "ar": "غسالة",
            "en": "Washing Machine",
            "fr": "Machine à laver"
        },
        "subtitle": {
            "ar": "حيث تلتقي النعومة بالتقنية",
            "en": "Where freshness meets technology",
            "fr": "Là où la fraîcheur rencontre la technologie"
        },
        "tagline": {
            "ar": "أجهزة كهربائية منزلية",
            "en": "Home Appliances",
            "fr": "Appareils électroménagers"
        },
        "ctaText": {
            "ar": "تسوّق الآن",
            "en": "Shop Now",
            "fr": "Acheter maintenant"
        },
        "ctaLink": "http://localhost:5173/shop/all",
        "imageUrl": "https://i.imgur.com/35D6z33.png",
        "productImageUrl": null,
        "expiresAt": null,
        "isActive": true,
        "displayOrder": 0,
        "createdAt": "2025-09-02T19:48:45.450Z",
        "updatedAt": "2025-09-02T19:49:01.168Z"
    },
    {
        "id": "75e43fe5-6fda-45cd-a355-6c64b5c6462b",
        "title": {
            "ar": "أحذية رياضية",
            "en": "Nike Jogger",
            "fr": "Nike Jogger"
        },
        "subtitle": {
            "ar": "تخفيضات تصل إلى %40 على أحذية الرياضة النسائية",
            "en": "Up to 40% off Women Sneakers",
            "fr": "Jusqu’à 40% de réduction sur les baskets femme"
        },
        "tagline": {
            "ar": "",
            "en": "",
            "fr": ""
        },
        "ctaText": {
            "ar": "تسوّق الآن",
            "en": "Shop Now",
            "fr": "Acheter maintenant"
        },
        "ctaLink": "http://localhost:5173/shop/all",
        "imageUrl": "https://i.imgur.com/FPWsDH1.png",
        "productImageUrl": null,
        "expiresAt": "2025-09-28T23:00:00.000Z",
        "isActive": true,
        "displayOrder": 0,
        "createdAt": "2025-09-02T19:52:20.867Z",
        "updatedAt": "2025-09-02T19:52:28.146Z"
    }
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

    // --- Seed Promotions ---
    console.log('Seeding promotions...');
    for (const promotion of promotionData) {
        await prisma.promotion.upsert({
            where: { id: promotion.id }, // Use the unique ID to find the record
            update: promotion, // If it exists, update it with this data
            create: promotion, // If it doesn't exist, create it with this data
        });
    }
    console.log('Promotions seeded successfully.');

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