const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const product = await prisma.product.findFirst();
  console.dir(product, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());
