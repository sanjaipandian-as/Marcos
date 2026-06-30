import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' }
  });
  console.log(admin?.id);
}

main().finally(() => prisma.$disconnect());
