import prisma from './config/db.js';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'sanjaipandian.as@gmail.com' }
  });
  console.log('--- USER PROFILE ---');
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
