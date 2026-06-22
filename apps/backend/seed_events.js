const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ take: 5 });
  if (products.length === 0) {
    console.log("No products found to attach events to.");
    return;
  }

  console.log("Creating 5 test users...");
  const testUsers = [];
  for (let i = 1; i <= 5; i++) {
    const email = `test${i}@marcos.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        phoneNumber: `987650000${i}`,
        passwordHash: 'dummyhash',
        fullName: `Test User ${i}`,
        role: 'CUSTOMER',
        referralCode: `TEST-REF-${i}-${Date.now()}`,
      }
    });
    testUsers.push(user);
  }

  console.log("Generating analytics events for funnel tracking...");
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    // Each user interacts with 3 products
    for (let j = 0; j < 3; j++) {
      const product = products[(i + j) % products.length];
      
      // PRODUCT_VIEW
      await prisma.analyticsEvent.create({
        data: { eventType: 'PRODUCT_VIEW', productId: product.id, userId: user.id }
      });

      // ADD_TO_CART
      await prisma.analyticsEvent.create({
        data: { eventType: 'ADD_TO_CART', productId: product.id, userId: user.id }
      });

      // Users 1 & 2: Full purchase funnel
      if (i < 2) {
        await prisma.analyticsEvent.create({
            data: { eventType: 'CHECKOUT_INITIATED', productId: product.id, userId: user.id }
        });
        await prisma.analyticsEvent.create({
            data: { eventType: 'PURCHASE_COMPLETED', productId: product.id, userId: user.id }
        });
      }
      // Users 3 & 4: Abandon cart at checkout
      else if (i < 4) {
        await prisma.analyticsEvent.create({
            data: { eventType: 'CHECKOUT_INITIATED', productId: product.id, userId: user.id }
        });
        await prisma.analyticsEvent.create({
            data: { eventType: 'CART_ABANDONED', productId: product.id, userId: user.id }
        });
      }
      // User 5: Just leaves in cart
    }
  }

  console.log("Seeded test users and analytics events successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
