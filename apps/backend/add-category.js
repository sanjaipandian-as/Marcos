const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getCategories() {
  const categories = await prisma.category.findMany();
  
  if (categories.length < 6) {
    const newCategory = await prisma.category.create({
      data: {
        name: "Kids Collection",
        slug: "kids-collection",
        order: categories.length + 1
      }
    });
    console.log("Created category:", newCategory.name);
  } else {
    console.log("Already have 6 or more categories.");
  }
  
  prisma.$disconnect();
}

getCategories();
