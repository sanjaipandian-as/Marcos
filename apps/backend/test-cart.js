const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ take: 1 });
  const user = users[0];
  const products = await prisma.product.findMany({ take: 1 });
  const product = products[0];

  console.log('User:', user.email, 'Product:', product.name);

  // Add to cart
  const cartItem = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId: product.id } },
    update: { quantity: 1 },
    create: { userId: user.id, productId: product.id, quantity: 1 }
  });
  console.log('CartItem created:', cartItem.id);

  // Read cart
  const cart = await prisma.cartItem.findMany({ where: { userId: user.id }, include: { product: true } });
  console.log('Cart count:', cart.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
