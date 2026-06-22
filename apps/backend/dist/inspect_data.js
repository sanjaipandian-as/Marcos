"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("./config/db.js"));
async function main() {
    const users = await db_js_1.default.user.findMany();
    console.log('=== USERS ===');
    for (const u of users) {
        console.log(`- ${u.fullName} (${u.email}) [${u.role}] ID: ${u.id}`);
    }
    const orders = await db_js_1.default.order.findMany({
        include: {
            user: true,
            orderItems: {
                include: {
                    product: true
                }
            }
        }
    });
    console.log('\n=== ORDERS ===');
    for (const o of orders) {
        console.log(`- Order ${o.invoiceNumber}: User=${o.user?.email || 'Guest'}, Status=${o.status}, Amount=${o.totalAmount}`);
        for (const item of o.orderItems) {
            console.log(`  * ${item.product.name} x ${item.quantity}`);
        }
    }
}
main().catch(console.error).finally(() => db_js_1.default.$disconnect());
