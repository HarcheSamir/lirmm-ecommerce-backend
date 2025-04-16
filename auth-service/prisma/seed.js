const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Delete all existing users
  await prisma.user.deleteMany();
  console.log("Cleared existing users.");

  const adminPassword = await bcrypt.hash('password', 10);
  const user1Password = await bcrypt.hash('password', 10);
  const user2Password = await bcrypt.hash('password', 10);

  const users = [
    {
      name: 'Admin User',
      email: 'admin@admin.com',
      password: adminPassword,
      role: 'ADMIN',
    },
    {
      name: 'User one',
      email: 'user1@gmail.com',
      password: user1Password,
      role: 'USER',
    },
    {
      name: 'User two',
      email: 'user2@gmail.com',
      password: user2Password,
      role: 'USER',
    }
  ];

  for (const user of users) {
    await prisma.user.create({ data: user });
    console.log(`Created user: ${user.email}`);
  }

  console.log(`Seeding finished. Created ${users.length} users.`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Disconnecting Prisma client...");
    await prisma.$disconnect();
  });
