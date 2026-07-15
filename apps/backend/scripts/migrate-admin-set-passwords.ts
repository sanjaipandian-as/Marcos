import prisma from '../src/config/db.js';
import AuthService from '../src/services/auth.service.js';
import { createAuditLog } from '../src/utils/audit.js';

async function main() {
  console.log("Starting migration of admin-set passwords...");
  const affected = await prisma.user.findMany({
    where: {
      passwordHash: { not: null },
      passwordSetByUser: false,
    },
  });

  console.log(`Found ${affected.length} users with admin-assigned passwords.`);

  for (const user of affected) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: null },
      });

      await AuthService.revokeAllUserSessions(user.id);

      await createAuditLog({
        userId: "system_migration",
        action: "PASSWORD_RESET_FORCED",
        ipAddress: "127.0.0.1",
        details: {
          message: `System migrated user ${user.email} from admin-set password to null password.`,
          targetUserId: user.id,
        },
      });
      console.log(`Successfully migrated user ${user.email}`);
    } catch (err: any) {
      console.error(`Error migrating user ${user.email}:`, err.message);
    }
  }

  console.log("Migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
