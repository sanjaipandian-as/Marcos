import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const boutiqueCategories = [
  { name: 'Sarees', slug: 'sarees', imageUrl: 'https://images.unsplash.com/photo-1610189013098-9ce2806bd748?w=800&q=80', order: 1 },
  { name: 'Lehengas', slug: 'lehengas', imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80', order: 2 },
  { name: 'Kurtis & Sets', slug: 'kurtis-sets', imageUrl: 'https://images.unsplash.com/photo-1583391733958-d1531471b20f?w=800&q=80', order: 3 },
  { name: 'Dresses', slug: 'dresses', imageUrl: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800&q=80', order: 4 },
  { name: 'Gowns', slug: 'gowns', imageUrl: 'https://images.unsplash.com/photo-1566160983196-857ce79d57a9?w=800&q=80', order: 5 },
  { name: 'Co-ords', slug: 'co-ords', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80', order: 6 }
];

async function main() {
  const existingCategories = await prisma.category.findMany({ orderBy: { order: 'asc' } });
  
  for (let i = 0; i < boutiqueCategories.length; i++) {
    const data = boutiqueCategories[i];
    if (i < existingCategories.length) {
      await prisma.category.update({
        where: { id: existingCategories[i].id },
        data: { name: data.name, slug: data.slug, imageUrl: data.imageUrl, order: data.order }
      });
      console.log(`Updated existing category to ${data.name}`);
    } else {
      await prisma.category.create({
        data
      });
      console.log(`Created new category ${data.name}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
