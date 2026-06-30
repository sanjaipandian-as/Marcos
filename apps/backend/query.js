const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getOrderDetails() {
  const order = await prisma.order.findUnique({
    where: { id: '7bd0691d-af00-457e-98a5-83df95651ba3' }
  });
  console.log("Order details:", JSON.stringify(order, null, 2));
  prisma.$disconnect();
}

getOrderDetails();
