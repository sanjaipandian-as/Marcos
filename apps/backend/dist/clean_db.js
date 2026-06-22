"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("./config/db.js"));
const crypto_js_1 = require("./utils/crypto.js");
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
    const keepUsers = await db_js_1.default.user.findMany({
        where: { email: { in: keepEmails } },
        select: { id: true, email: true }
    });
    const keepUserIds = keepUsers.map(u => u.id);
    console.log(`Preserving user accounts: ${keepEmails.join(', ')} (IDs: ${keepUserIds.join(', ')})`);
    // 2. Delete dependent records of other users to satisfy FK constraints
    console.log('Deleting dependent records of dummy users...');
    // Delete OrderItems for orders belonging to users we don't keep
    await db_js_1.default.orderItem.deleteMany({
        where: {
            order: {
                userId: { notIn: keepUserIds }
            }
        }
    });
    // Delete Invoices for orders belonging to users we don't keep
    await db_js_1.default.invoice.deleteMany({
        where: {
            order: {
                userId: { notIn: keepUserIds }
            }
        }
    });
    // Delete Orders belonging to users we don't keep
    await db_js_1.default.order.deleteMany({
        where: {
            userId: { notIn: keepUserIds }
        }
    });
    // Delete CartItems for users we don't keep
    await db_js_1.default.cartItem.deleteMany({
        where: {
            userId: { notIn: keepUserIds }
        }
    });
    // Delete Favorites for users we don't keep
    await db_js_1.default.favorite.deleteMany({
        where: {
            userId: { notIn: keepUserIds }
        }
    });
    // Delete UserCoupons for users we don't keep
    await db_js_1.default.userCoupon.deleteMany({
        where: {
            userId: { notIn: keepUserIds }
        }
    });
    // Delete Appointments for users we don't keep
    await db_js_1.default.appointment.deleteMany({
        where: {
            userId: { notIn: keepUserIds }
        }
    });
    // Delete VisitReports for store visits
    await db_js_1.default.visitReport.deleteMany({
        where: {
            visit: {
                customerId: { notIn: keepUserIds }
            }
        }
    });
    // Delete StoreVisits for users we don't keep
    await db_js_1.default.storeVisit.deleteMany({
        where: {
            customerId: { notIn: keepUserIds }
        }
    });
    // Delete PointTransactions for users we don't keep
    await db_js_1.default.pointTransaction.deleteMany({
        where: {
            userId: { notIn: keepUserIds }
        }
    });
    // Delete MeasurementHistory for profiles
    await db_js_1.default.measurementHistory.deleteMany({
        where: {
            profile: {
                userId: { notIn: keepUserIds }
            }
        }
    });
    // Delete MeasurementProfiles for users we don't keep
    await db_js_1.default.measurementProfile.deleteMany({
        where: {
            userId: { notIn: keepUserIds }
        }
    });
    // Delete NotificationRecipient for users we don't keep
    await db_js_1.default.notificationRecipient.deleteMany({
        where: {
            userId: { notIn: keepUserIds }
        }
    });
    // Delete SupportTicketMessages for tickets
    await db_js_1.default.supportTicketMessage.deleteMany({
        where: {
            ticket: {
                userId: { notIn: keepUserIds }
            }
        }
    });
    // Delete SupportTickets for users we don't keep
    await db_js_1.default.supportTicket.deleteMany({
        where: {
            userId: { notIn: keepUserIds }
        }
    });
    // Delete AuditLogs for users we don't keep
    await db_js_1.default.auditLog.deleteMany({
        where: {
            userId: { notIn: keepUserIds }
        }
    });
    // 3. Delete users who are not in the preserve list
    const deleteResult = await db_js_1.default.user.deleteMany({
        where: {
            email: { notIn: keepEmails }
        }
    });
    console.log(`Deleted ${deleteResult.count} dummy user accounts.`);
    // 4. Create new clean Admin and Tailor users
    console.log('Creating clean Admin and Tailor users...');
    const adminEmail = 'marcos@admin.com';
    const tailorEmail = 'marcos@tailor.com';
    const adminPasswordHash = await (0, crypto_js_1.hashPassword)('Marcos@admin123');
    const tailorPasswordHash = await (0, crypto_js_1.hashPassword)('Marcos@tailor123');
    const adminUser = await db_js_1.default.user.upsert({
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
    const tailorUser = await db_js_1.default.user.upsert({
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
main().catch(console.error).finally(() => db_js_1.default.$disconnect());
