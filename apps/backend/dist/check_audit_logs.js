"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("./config/db.js"));
async function checkAuditLogs() {
    try {
        const logs = await db_js_1.default.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        console.log('--- RECENT AUDIT LOGS ---');
        console.log(JSON.stringify(logs, null, 2));
        console.log('-------------------------');
    }
    catch (error) {
        console.error('Error fetching audit logs:', error);
    }
    finally {
        await db_js_1.default.$disconnect();
    }
}
checkAuditLogs();
