import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old seed data...');
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.banner.deleteMany({});

  console.log('Seeding data...');

  // 1. Categories
  const categoriesData = [
    { name: 'Bespoke Suits', slug: 'bespoke-suits', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop' },
    { name: 'Designer Shirts', slug: 'designer-shirts', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop' },
    { name: 'Ethnic Wear', slug: 'ethnic-wear', img: 'https://images.unsplash.com/photo-1583391733959-1c51bf69941a?q=80&w=800&auto=format&fit=crop' },
    { name: 'Winter Collection', slug: 'winter-collection', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop' },
    { name: 'Premium Accessories', slug: 'premium-accessories', img: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=800&auto=format&fit=crop' },
  ];

  const createdCategories = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        order: categoriesData.indexOf(cat),
      },
    });
    createdCategories.push({ ...created, img: cat.img });
    console.log(`Created category: ${created.name}`);
  }

  const productImages: Record<string, string[]> = {
    'bespoke-suits': [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585435421671-0c16764628ce?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1598808503746-f34c53b9323e?q=80&w=800&auto=format&fit=crop',
    ],
    'designer-shirts': [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1626497764746-6dc36546b388?q=80&w=800&auto=format&fit=crop',
    ],
    'ethnic-wear': [
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop',
    ],
    'winter-collection': [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?q=80&w=800&auto=format&fit=crop',
    ],
    'premium-accessories': [
      'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509941943102-10c232535736?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=800&auto=format&fit=crop',
    ]
  };

  // 2. Products (5 per category)
  let productCounter = 1;
  for (const category of createdCategories) {
    const images = productImages[category.slug] || [category.img, category.img, category.img, category.img, category.img];
    for (let i = 1; i <= 5; i++) {
      const productName = `${category.name} Item ${i}`;
      await prisma.product.create({
        data: {
          name: productName,
          description: `Premium quality ${productName.toLowerCase()} crafted to perfection.`,
          price: 1500 + (Math.random() * 5000),
          materialInfo: '100% Premium Cotton/Wool Blend',
          images: [images[i - 1]],
          categoryId: category.id,
          inventoryQty: 50,
          stockStatus: 'IN_STOCK',
        }
      });
      productCounter++;
    }
    console.log(`Created 5 products for ${category.name}`);
  }

  // 3. Promo Banners (4)
  const bannersData = [
    { title: 'Summer Collection Sale', imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Wedding Specials', imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop' },
    { title: 'New Arrivals', imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Exclusive Bespoke Experience', imageUrl: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop' },
  ];

  for (const banner of bannersData) {
    await prisma.banner.create({
      data: {
        title: banner.title,
        imageUrl: banner.imageUrl,
        location: 'HOME_SLIDER',
        isActive: true,
      }
    });
  }
  console.log('Created 4 Promo Banners');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
