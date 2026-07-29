const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Enabling pg_trgm extension...');
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

  console.log('Creating GIN trigram index on Product.name...');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING gin ("name" gin_trgm_ops);');

  console.log('Creating GIN trigram index on Product.description...');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Product_description_trgm_idx" ON "Product" USING gin ("description" gin_trgm_ops);');

  console.log('Indexes created successfully!');
}

main()
  .catch((err) => {
    console.error('Error creating indexes:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
