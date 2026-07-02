"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("./config/db.js"));
async function main() {
    try {
        const plans = [
            {
                title: '₹500 Discount Voucher',
                pointsRequired: 500,
                discountFlat: 500.00,
                description: 'Redeem 500 points for a flat ₹500 discount on your next order.'
            },
            {
                title: '₹1,200 Discount Voucher',
                pointsRequired: 1000,
                discountFlat: 1200.00,
                description: 'Redeem 1000 points for a flat ₹1,200 discount on your next order.'
            },
            {
                title: '₹50 Special Promo',
                pointsRequired: 5000,
                discountFlat: 50.00,
                description: 'Redeem 5000 points for a flat ₹50 discount.'
            }
        ];
        for (const plan of plans) {
            const existing = await db_js_1.default.voucherPlan.findFirst({
                where: { title: plan.title }
            });
            if (!existing) {
                await db_js_1.default.voucherPlan.create({ data: plan });
                console.log(`Created: ${plan.title}`);
            }
            else {
                console.log(`Already exists: ${plan.title}`);
            }
        }
        console.log('Seeding completed successfully!');
    }
    catch (err) {
        console.error('Error seeding vouchers:', err);
    }
    finally {
        await db_js_1.default.$disconnect();
    }
}
main();
