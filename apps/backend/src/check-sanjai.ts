import prisma from './config/db.js';

async function main() {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: 'sanjai', mode: 'insensitive' } },
          { email: { contains: 'sanjai', mode: 'insensitive' } },
          { fullName: { contains: 'pandian', mode: 'insensitive' } },
          { email: { contains: 'pandian', mode: 'insensitive' } },
        ]
      }
    });
    console.log('--- MATCHING USERS ---');
    console.log(JSON.stringify(users, null, 2));

    const orders = await prisma.order.findMany({
      include: {
        user: true,
      }
    });

    console.log('--- ALL ORDERS IN DB ---');
    console.log(orders.map(o => ({
      id: o.id,
      invoiceNumber: o.invoiceNumber,
      userId: o.userId,
      userFullName: o.user?.fullName,
      guestName: (o.gatewayResponse as any)?.guestCustomerName,
    })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
