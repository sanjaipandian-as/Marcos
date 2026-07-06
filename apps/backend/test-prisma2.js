const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const order = await prisma.order.findFirst({
    where: { orderItems: { some: {} } },
    include: { orderItems: { include: { product: true } } }
  });
  console.dir(order, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());
