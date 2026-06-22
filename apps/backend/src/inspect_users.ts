import prisma from './config/db.js';

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      address: true,
      role: true,
    }
  });
  console.log('--- USERS IN DATABASE ---');
  console.dir(users, { depth: null });

  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          fullName: true,
          address: true
        }
      }
    }
  });
  console.log('\n--- RECENT ORDERS IN DATABASE ---');
  console.dir(orders, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
