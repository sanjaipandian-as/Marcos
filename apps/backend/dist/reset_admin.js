"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Resets or creates the marcos@admin.com SUPERADMIN account.
 * Run with: npx ts-node src/reset_admin.ts
 */
const db_js_1 = __importDefault(require("./config/db.js"));
const crypto_js_1 = require("./utils/crypto.js");
const EMAIL = 'marcos@admin.com';
const PASSWORD = 'Marcos@admin123';
async function main() {
    console.log(`🔧 Resetting admin account: ${EMAIL}`);
    const passwordHash = await (0, crypto_js_1.hashPassword)(PASSWORD);
    const user = await db_js_1.default.user.upsert({
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
    .finally(() => db_js_1.default.$disconnect());
