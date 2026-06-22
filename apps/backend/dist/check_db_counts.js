"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("./config/db.js"));
async function main() {
    const tables = [
        'User',
        'MeasurementProfile',
        'MeasurementHistory',
        'Category',
        'Product',
        'CartItem',
        'Favorite',
        'Coupon',
        'UserCoupon',
        'Appointment',
        'StoreVisit',
        'VisitReport',
        'PointTransaction',
        'Order',
        'OrderItem',
        'Invoice',
        'Banner',
        'Notification',
        'NotificationRecipient',
        'SupportTicket',
        'SupportTicketMessage',
        'AuditLog',
        'SystemSettings',
        'AnalyticsEvent'
    ];
    console.log('=== TABLE RECORD COUNTS ===');
    for (const table of tables) {
        try {
            const count = await db_js_1.default[table.charAt(0).toLowerCase() + table.slice(1)].count();
            console.log(`- ${table}: ${count}`);
        }
        catch (err) {
            console.log(`- ${table}: Error (${err.message})`);
        }
    }
}
main().catch(console.error).finally(() => db_js_1.default.$disconnect());
