  import prisma from './config/db.js';

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true
    }
  });
  console.table(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
