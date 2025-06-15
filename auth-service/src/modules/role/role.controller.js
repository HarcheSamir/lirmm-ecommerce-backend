// ===== FILE: auth-service/src/modules/role/role.controller.js =====

const prisma = require('../../config/prisma');

const roleSelect = {
    id: true,
    name: true,
    description: true,
    permissions: {
        select: {
            permission: { select: { id: true, name: true, description: true } }
        }
    },
    _count: { select: { users: true } }
};

// Helper to format role response
const formatRole = (role) => {
    if (!role) return null;
    const { _count, ...rest } = role;
    return {
        ...rest,
        userCount: _count.users,
        permissions: role.permissions.map(p => p.permission),
    };
};

const getAllRoles = async (req, res, next) => {
    try {
        const roles = await prisma.role.findMany({ select: roleSelect, orderBy: { name: 'asc' } });
        res.json(roles.map(formatRole));
    } catch (err) {
        next(err);
    }
};

const getRoleById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = await prisma.role.findUnique({ where: { id }, select: roleSelect });
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.json(formatRole(role));
    } catch (err) {
        next(err);
    }
};

const createRole = async (req, res, next) => {
    try {
        const { name, description, permissionIds } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Role name is required.' });
        }

        const newRole = await prisma.role.create({
            data: {
                name,
                description,
                permissions: permissionIds && permissionIds.length > 0 ? {
                    create: permissionIds.map(pid => ({
                        permission: { connect: { id: pid } }
                    }))
                } : undefined,
            },
            select: roleSelect,
        });

        res.status(201).json(formatRole(newRole));
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ message: `A role with the name '${req.body.name}' already exists.` });
        }
        if (err.code === 'P2025') {
            return res.status(400).json({ message: 'One or more provided permissionIds are invalid.' });
        }
        next(err);
    }
};

const updateRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, permissionIds } = req.body;

        const roleToUpdate = await prisma.role.findUnique({ where: { id } });
        if (!roleToUpdate) {
            return res.status(404).json({ message: 'Role not found' });
        }
        if (['ADMIN', 'CLIENT'].includes(roleToUpdate.name) && roleToUpdate.name !== name) {
            return res.status(403).json({ message: `Forbidden: The foundational '${roleToUpdate.name}' role cannot be renamed.`});
        }

        const updatedRole = await prisma.$transaction(async (tx) => {
            // Update basic info
            const role = await tx.role.update({
                where: { id },
                data: { name, description },
            });
            // If permissionIds is provided, we replace all existing permissions
            if (Array.isArray(permissionIds)) {
                // Delete existing permissions for this role
                await tx.rolePermission.deleteMany({ where: { roleId: id } });
                // Add new permissions
                if (permissionIds.length > 0) {
                    await tx.rolePermission.createMany({
                        data: permissionIds.map(pid => ({ roleId: id, permissionId: pid })),
                    });
                }
            }
            return role;
        });

        const fullUpdatedRole = await prisma.role.findUnique({ where: { id: updatedRole.id }, select: roleSelect });
        res.json(formatRole(fullUpdatedRole));
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ message: `A role with the name '${req.body.name}' already exists.` });
        }
        next(err);
    }
};

const deleteRole = async (req, res, next) => {
    try {
        const { id } = req.params;

        const role = await prisma.role.findUnique({ where: { id }, select: { name: true, _count: { select: { users: true } } }});
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        if (['ADMIN', 'CLIENT'].includes(role.name)) {
            return res.status(403).json({ message: `Forbidden: The foundational '${role.name}' role cannot be deleted.`});
        }
        if (role._count.users > 0) {
            return res.status(409).json({ message: `Cannot delete role. It is currently assigned to ${role._count.users} user(s).` });
        }

        await prisma.role.delete({ where: { id } });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
};