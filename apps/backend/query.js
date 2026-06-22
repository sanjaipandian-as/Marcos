const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getOldestOrder() {
  const oldest = await prisma.order.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true }
  });
  console.log("Oldest order created at:", oldest ? oldest.createdAt : "No orders");
  prisma.$disconnect();
}

getOldestOrder();
