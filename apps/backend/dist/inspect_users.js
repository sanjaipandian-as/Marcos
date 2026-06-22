"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("./config/db.js"));
async function main() {
    const users = await db_js_1.default.user.findMany({
        select: {
            id: true,
            email: true,
            fullName: true,
            address: true,
            role: true,
        }
    });
    console.log('--- USERS IN DATABASE ---');
    console.dir(users, { depth: null });
    const orders = await db_js_1.default.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    fullName: true,
                    address: true
                }
            }
        }
    });
    console.log('\n--- RECENT ORDERS IN DATABASE ---');
    console.dir(orders, { depth: null });
}
main()
    .catch(console.error)
    .finally(() => db_js_1.default.$disconnect());
