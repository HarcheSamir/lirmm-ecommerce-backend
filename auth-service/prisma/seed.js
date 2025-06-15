// ===== FILE: auth-service/prisma/seed.js =====
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt'); // Use bcrypt for consistency

const prisma = new PrismaClient();

// Define all system permissions here
// Format: action:resource
const ALL_PERMISSIONS = [
  // User Management
  { name: 'read:users', description: 'Read all user information' },
  { name: 'write:users', description: 'Create or update users' },
  { name: 'delete:users', description: 'Delete users' },
  // Role & Permission Management
  { name: 'read:roles', description: 'Read roles and their permissions' },
  { name: 'write:roles', description: 'Create or update roles and assign permissions' },
  // Product & Catalog Management
  { name: 'create:product', description: 'Create a new product' },
  { name: 'update:product', description: 'Update any product' },
  { name: 'delete:product', description: 'Delete any product' },
  { name: 'create:category', description: 'Create a new category' },
  { name: 'update:category', description: 'Update any category' },
  { name: 'delete:category', description: 'Delete any category' },
  // Stock Management
  { name: 'adjust:stock', description: 'Adjust stock for any product variant' },
  // Cart & Order (placeholders for future)
  { name: 'read:carts', description: 'Read any user\'s cart' },
  { name: 'read:orders', description: 'Read all orders' },
  { name: 'create:order', description: 'Create a new order for oneself' },
  { name: 'read:my-orders', description: 'Read one\'s own orders' },
  { name: 'read:all-orders', description: 'Read all user orders' },
  { name: 'update:order-status', description: 'Update the status of any order' },
  // Public/Client permissions (less restrictive)
  { name: 'read:products', description: 'Read public product information' },
  { name: 'read:categories', description: 'Read public category information' },
];

async function main() {
  console.log(`Start seeding ...`);

  // 1. Clear previous data in the correct order to avoid constraint errors
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  console.log('Cleared existing data.');

  // 2. Create all permissions
  await prisma.permission.createMany({
    data: ALL_PERMISSIONS,
    skipDuplicates: true,
  });
  const permissions = await prisma.permission.findMany();
  console.log(`Created/verified ${permissions.length} permissions.`);

  // 3. Create Roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'Super administrator with all permissions',
    },
  });

  const clientRole = await prisma.role.create({
    data: {
      name: 'CLIENT',
      description: 'Customer role with permissions to browse and purchase.',
    },
  });
  console.log('Created ADMIN and CLIENT roles.');

  // 4. Assign Permissions to Roles
  // ADMIN gets all permissions
  await prisma.rolePermission.createMany({
    data: permissions.map(p => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
  });
  console.log(`Assigned all ${permissions.length} permissions to ADMIN role.`);

  // CLIENT gets a specific subset of permissions
  const clientPermissionNames = ['read:products', 'read:categories', 'create:order',
    'read:my-orders'
  ];
  const clientPermissions = await prisma.permission.findMany({
    where: {
      name: { in: clientPermissionNames },
    },
  });
  await prisma.rolePermission.createMany({
    data: clientPermissions.map(p => ({
      roleId: clientRole.id,
      permissionId: p.id,
    })),
  });
  console.log(`Assigned ${clientPermissions.length} permissions to CLIENT role.`);

  // 5. Create Users and assign them a Role
  const hashedPassword = await bcrypt.hash('password', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@admin.com',
      password: hashedPassword,
      roleId: adminRole.id, // Assign by roleId
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  const clientUser = await prisma.user.create({
    data: {
      name: 'Samir Client',
      email: 'samir@client.com',
      password: hashedPassword,
      roleId: clientRole.id, // Assign by roleId
    },
  });
  console.log(`Created client user: ${clientUser.email}`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Disconnecting Prisma client...');
    await prisma.$disconnect();
  });