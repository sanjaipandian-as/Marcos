/**
 * Resets or creates the marcos@admin.com SUPERADMIN account.
 * Run with: npx ts-node src/reset_admin.ts
 */
import prisma from './config/db.js';
import { hashPassword } from './utils/crypto.js';

const EMAIL = 'marcos@admin.com';
const PASSWORD = 'Marcos@admin123';

async function main() {
  console.log(`🔧 Resetting admin account: ${EMAIL}`);

  const passwordHash = await hashPassword(PASSWORD);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      passwordHash,
      role: 'SUPERADMIN',
    },
    create: {
      email: EMAIL,
      phoneNumber: '+919999998888',
      passwordHash,
      fullName: 'Marcos SuperAdmin',
      role: 'SUPERADMIN',
      referralCode: 'REF-MARCOSADMIN',
    },
  });

  console.log('\n✅ Admin Account Ready!');
  console.log('─────────────────────────────────────');
  console.log(`  Email    : ${EMAIL}`);
  console.log(`  Password : ${PASSWORD}`);
  console.log(`  Role     : ${user.role}`);
  console.log(`  ID       : ${user.id}`);
  console.log('─────────────────────────────────────');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
