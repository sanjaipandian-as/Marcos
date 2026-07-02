import prisma from './config/db.js';

async function main() {
  try {
    const plans = [
      {
        title: '₹500 Discount Voucher',
        pointsRequired: 500,
        discountFlat: 500.00,
        description: 'Redeem 500 points for a flat ₹500 discount on your next order.'
      },
      {
        title: '₹1,200 Discount Voucher',
        pointsRequired: 1000,
        discountFlat: 1200.00,
        description: 'Redeem 1000 points for a flat ₹1,200 discount on your next order.'
      },
      {
        title: '₹50 Special Promo',
        pointsRequired: 5000,
        discountFlat: 50.00,
        description: 'Redeem 5000 points for a flat ₹50 discount.'
      }
    ];

    for (const plan of plans) {
      const existing = await (prisma as any).voucherPlan.findFirst({
        where: { title: plan.title }
      });
      if (!existing) {
        await (prisma as any).voucherPlan.create({ data: plan });
        console.log(`Created: ${plan.title}`);
      } else {
        console.log(`Already exists: ${plan.title}`);
      }
    }
    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding vouchers:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
