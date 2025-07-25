const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
    { name: 'read:user', description: 'Read all user information' },
    { name: 'write:user', description: 'Create or update users' },
    { name: 'delete:user', description: 'Deactivate users' },
    { name: 'read:role', description: 'Read roles and their permissions' },
    { name: 'write:role', description: 'Create or update roles and assign permissions' },
    { name: 'create:product', description: 'Create a new product' },
    { name: 'update:product', description: 'Update any product' },
    { name: 'delete:product', description: 'Delete any product' },
    { name: 'create:category', description: 'Create a new category' },
    { name: 'update:category', description: 'Update any category' },
    { name: 'delete:category', description: 'Delete any category' },
    { name: 'adjust:stock', description: 'Adjust stock for any product variant' },
    { name: 'read:order', description: 'Read all user orders' },
    { name: 'update:order', description: 'Update the status of any order' },
    { name: 'read:my-orders', description: 'Read one\'s own orders' },
    { name: 'create:order', description: 'Create a new order for oneself' },
    { name: 'read:review', description: 'Read one\'s own reviews' },
    { name: 'write:review', description: 'Create or update one\'s own reviews' },
    { name: 'delete:review', description: 'Delete any review (for admins) or one\'s own' },
];

async function main() {
    console.log(`Start seeding ...`);

    // --- Clear Data ---
    await prisma.rolePermission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    console.log('Cleared existing data.');

    // --- Create Permissions ---
    await prisma.permission.createMany({ data: ALL_PERMISSIONS, skipDuplicates: true });
    const permissions = await prisma.permission.findMany();
    const permissionsMap = new Map(permissions.map(p => [p.name, p.id]));
    console.log(`Created/verified ${permissions.length} permissions.`);

    // --- Create Roles ---
    const rolesToCreate = {
        ADMIN: { desc: 'Super administrator with all permissions.', perms: permissions.map(p => p.id) },
        Supervisor: {
            desc: 'Oversees operations and users.',
            perms: ['read:user', 'read:order', 'update:order', 'read:product', 'read:category', 'adjust:stock'].map(name => permissionsMap.get(name))
        },
        Support: {
            desc: 'Provides technical assistance.',
            perms: ['read:user', 'read:order'].map(name => permissionsMap.get(name))
        },
        Auditor: {
            desc: 'Reviews system activities.',
            perms: ['read:user', 'read:role', 'read:product', 'read:category', 'read:order'].map(name => permissionsMap.get(name))
        },
        Customer: {
            desc: 'Customer role with permissions to browse and purchase.',
            perms: ['read:my-orders', 'create:order', 'read:review', 'write:review', 'delete:review'].map(name => permissionsMap.get(name))
        }
    };

    const createdRoles = {};
    for (const [name, data] of Object.entries(rolesToCreate)) {
        const role = await prisma.role.create({
            data: {
                name,
                description: data.desc,
                permissions: { create: data.perms.filter(Boolean).map(pid => ({ permissionId: pid })) }
            }
        });
        createdRoles[name] = role;
        console.log(`Created role '${name}' and assigned ${data.perms.filter(Boolean).length} permissions.`);
    }

    const hashedPassword = await bcrypt.hash('password', 10);

    // --- Create Staff Users ---
    const usersToCreate = [
        { name: 'Super Admin', email: 'admin@admin.com', roleName: 'ADMIN', profileImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU0ecGE0Lnl9K2KG8sKnO23uA15IAv8PmDUjnjHNivuzML5mecJtbo-QRO4-6B9NBwRE8&usqp=CAU' },
        { name: 'Fatima Supervisor', email: 'user2@gmail.com', roleName: 'Supervisor', profileImage: 'https://randomuser.me/api/portraits/women/2.jpg' },
        { name: 'Youssef Support', email: 'user3@gmail.com', roleName: 'Support', profileImage: 'https://randomuser.me/api/portraits/men/3.jpg' },
        { name: 'Amina Auditor', email: 'user4@gmail.com', roleName: 'Auditor', profileImage: 'https://randomuser.me/api/portraits/women/4.jpg' },
        { name: 'Samira Supervisor', email: 'user8@gmail.com', roleName: 'Supervisor', profileImage: 'https://randomuser.me/api/portraits/women/8.jpg' },
    ];

    for (const userData of usersToCreate) {
        const role = createdRoles[userData.roleName];
        if (!role) { continue; }
        await prisma.user.create({
            data: {
                name: userData.name, email: userData.email, password: hashedPassword,
                profileImage: userData.profileImage,
                isActive: userData.isActive !== undefined ? userData.isActive : true,
                roleId: role.id,
            }
        });
        console.log(`Created user: ${userData.name} with role ${userData.roleName}`);
    }

    console.log(`Seeding finished.`);
}

main().catch((e) => { console.error('Error during seeding:', e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });