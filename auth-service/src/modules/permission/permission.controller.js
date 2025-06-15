// ===== FILE: auth-service/src/modules/permission/permission.controller.js =====

const prisma = require('../../config/prisma');

const getAllPermissions = async (req, res, next) => {
    try {
        const permissions = await prisma.permission.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(permissions);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllPermissions,
};