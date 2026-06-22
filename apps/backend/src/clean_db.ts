import prisma from './config/db.js';
import { hashPassword } from './utils/crypto.js';

// ══════════════════════════════════════════════════════════════════════════════
// 🚨 SAFETY: Requires --force flag to prevent accidental execution
// Run with: npx ts-node src/clean_db.ts --force
// ══════════════════════════════════════════════════════════════════════════════
const FORCE_FLAG = process.argv.includes('--force');

if (!FORCE_FLAG) {
  console.error('\n');
  console.error('╔══════════════════════════════════════════════════════════════╗');
  console.error('║  ❌  ABORTED — MISSING REQUIRED --force FLAG               ║');
  console.error('╠══════════════════════════════════════════════════════════════╣');
  console.error('║                                                              ║');
  console.error('║  This script will DELETE most user accounts and their data. ║');
  console.error('║  If you are SURE, run:                                       ║');
  console.error('║    npx ts-node src/clean_db.ts --force                      ║');
  console.error('║                                                              ║');
  console.error('╚══════════════════════════════════════════════════════════════╝');
  console.error('\n');
  process.exit(1);
}

async function main() {
  console.log('🧹 Starting database cleanup...');

  // 1. Identify target users to keep
  const keepEmails = ['sanjaipandian.as@gmail.com'];
  
  // Find user IDs of users to keep
  const keepUsers = await prisma.user.findMany({
    where: { email: { in: keepEmails } },
    select: { id: true, email: true }
  });
  
  const keepUserIds = keepUsers.map(u => u.id);
  console.log(`Preserving user accounts: ${keepEmails.join(', ')} (IDs: ${keepUserIds.join(', ')})`);

  // 2. Delete dependent records of other users to satisfy FK constraints
  console.log('Deleting dependent records of dummy users...');

  // Delete OrderItems for orders belonging to users we don't keep
  await prisma.orderItem.deleteMany({
    where: {
      order: {
        userId: { notIn: keepUserIds }
      }
    }
  });

  // Delete Invoices for orders belonging to users we don't keep
  await prisma.invoice.deleteMany({
    where: {
      order: {
        userId: { notIn: keepUserIds }
      }
    }
  });

  // Delete Orders belonging to users we don't keep
  await prisma.order.deleteMany({
    where: {
      userId: { notIn: keepUserIds }
    }
  });

  // Delete CartItems for users we don't keep
  await prisma.cartItem.deleteMany({
    where: {
      userId: { notIn: keepUserIds }
    }
  });

  // Delete Favorites for users we don't keep
  await prisma.favorite.deleteMany({
    where: {
      userId: { notIn: keepUserIds }
    }
  });

  // Delete UserCoupons for users we don't keep
  await prisma.userCoupon.deleteMany({
    where: {
      userId: { notIn: keepUserIds }
    }
  });

  // Delete Appointments for users we don't keep
  await prisma.appointment.deleteMany({
    where: {
      userId: { notIn: keepUserIds }
    }
  });

  // Delete VisitReports for store visits
  await prisma.visitReport.deleteMany({
    where: {
      visit: {
        customerId: { notIn: keepUserIds }
      }
    }
  });

  // Delete StoreVisits for users we don't keep
  await prisma.storeVisit.deleteMany({
    where: {
      customerId: { notIn: keepUserIds }
    }
  });

  // Delete PointTransactions for users we don't keep
  await prisma.pointTransaction.deleteMany({
    where: {
      userId: { notIn: keepUserIds }
    }
  });

  // Delete MeasurementHistory for profiles
  await prisma.measurementHistory.deleteMany({
    where: {
      profile: {
        userId: { notIn: keepUserIds }
      }
    }
  });

  // Delete MeasurementProfiles for users we don't keep
  await prisma.measurementProfile.deleteMany({
    where: {
      userId: { notIn: keepUserIds }
    }
  });

  // Delete NotificationRecipient for users we don't keep
  await prisma.notificationRecipient.deleteMany({
    where: {
      userId: { notIn: keepUserIds }
    }
  });

  // Delete SupportTicketMessages for tickets
  await prisma.supportTicketMessage.deleteMany({
    where: {
      ticket: {
        userId: { notIn: keepUserIds }
      }
    }
  });

  // Delete SupportTickets for users we don't keep
  await prisma.supportTicket.deleteMany({
    where: {
      userId: { notIn: keepUserIds }
    }
  });

  // Delete AuditLogs for users we don't keep
  await prisma.auditLog.deleteMany({
    where: {
      userId: { notIn: keepUserIds }
    }
  });

  // 3. Delete users who are not in the preserve list
  const deleteResult = await prisma.user.deleteMany({
    where: {
      email: { notIn: keepEmails }
    }
  });
  console.log(`Deleted ${deleteResult.count} dummy user accounts.`);

  // 4. Create new clean Admin and Tailor users
  console.log('Creating clean Admin and Tailor users...');
  
  const adminEmail = 'marcos@admin.com';
  const tailorEmail = 'marcos@tailor.com';
  
  const adminPasswordHash = await hashPassword('Marcos@admin123');
  const tailorPasswordHash = await hashPassword('Marcos@tailor123');

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: 'SUPERADMIN',
    },
    create: {
      email: adminEmail,
      phoneNumber: '+919999998888',
      passwordHash: adminPasswordHash,
      fullName: 'Marcos SuperAdmin',
      role: 'SUPERADMIN',
      referralCode: 'REF-MARCOSADMIN',
    }
  });
  console.log(`SuperAdmin ready: ${adminUser.email} (Password: Marcos@admin123)`);

  const tailorUser = await prisma.user.upsert({
    where: { email: tailorEmail },
    update: {
      passwordHash: tailorPasswordHash,
      role: 'STAFF',
    },
    create: {
      email: tailorEmail,
      phoneNumber: '+917777777777',
      passwordHash: tailorPasswordHash,
      fullName: 'Marcos Tailor',
      role: 'STAFF',
      referralCode: 'REF-MARCOSTAILOR',
    }
  });
  console.log(`Tailor Staff ready: ${tailorUser.email} (Password: Marcos@tailor123)`);

  console.log('🎉 Database cleanup complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
