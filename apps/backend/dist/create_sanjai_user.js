"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Creates OR resets the developer's personal account (sanjaipandian.as@gmail.com).
 * Safe to run multiple times — uses upsert (no duplicate errors).
 * Run with: npx ts-node src/create_sanjai_user.ts
 */
const db_js_1 = __importDefault(require("./config/db.js"));
const crypto_js_1 = require("./utils/crypto.js");
const EMAIL = 'sanjaipandian.as@gmail.com';
const PHONE = '+919000000002';
const PASSWORD = '12345678';
const FULL_NAME = 'Sanjai Pandian';
const ROLE = 'CUSTOMER'; // Change to 'ADMIN' if you need admin access on mobile
async function main() {
    console.log(`🔧 Creating/resetting account for ${EMAIL}...`);
    const passwordHash = await (0, crypto_js_1.hashPassword)(PASSWORD);
    const user = await db_js_1.default.user.upsert({
        where: { email: EMAIL },
        update: {
            passwordHash,
            fullName: FULL_NAME,
        },
        create: {
            email: EMAIL,
            phoneNumber: PHONE,
            passwordHash,
            fullName: FULL_NAME,
            role: ROLE,
            referralCode: 'REF-SANJAI-0001',
            pointsBalance: 500,
        },
    });
    console.log('\n✅ Account ready!');
    console.log('─────────────────────────────────────');
    console.log(`  Email    : ${EMAIL}`);
    console.log(`  Phone    : ${PHONE}`);
    console.log(`  Password : ${PASSWORD}`);
    console.log(`  Role     : ${user.role}`);
    console.log(`  ID       : ${user.id}`);
    console.log('─────────────────────────────────────');
    console.log('\n📱 Use these credentials to login in the MARCOS mobile app.');
}
main()
    .catch(console.error)
    .finally(() => db_js_1.default.$disconnect());
