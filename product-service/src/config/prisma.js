const { PrismaClient } = require('@prisma/client');

// Add logging configuration for development/debugging
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = prisma;