const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.order.count();
  const countWithItems = await prisma.order.count({ where: { orderItems: { some: {} } } });
  console.log('Total orders:', count);
  console.log('Orders with items:', countWithItems);
}
main().catch(console.error).finally(() => prisma.$disconnect());
