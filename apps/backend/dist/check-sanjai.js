"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("./config/db.js"));
async function main() {
    try {
        const users = await db_js_1.default.user.findMany({
            where: {
                OR: [
                    { fullName: { contains: 'sanjai', mode: 'insensitive' } },
                    { email: { contains: 'sanjai', mode: 'insensitive' } },
                    { fullName: { contains: 'pandian', mode: 'insensitive' } },
                    { email: { contains: 'pandian', mode: 'insensitive' } },
                ]
            }
        });
        console.log('--- MATCHING USERS ---');
        console.log(JSON.stringify(users, null, 2));
        const orders = await db_js_1.default.order.findMany({
            include: {
                user: true,
            }
        });
        console.log('--- ALL ORDERS IN DB ---');
        console.log(orders.map(o => ({
            id: o.id,
            invoiceNumber: o.invoiceNumber,
            userId: o.userId,
            userFullName: o.user?.fullName,
            guestName: o.gatewayResponse?.guestCustomerName,
        })));
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await db_js_1.default.$disconnect();
    }
}
main();
