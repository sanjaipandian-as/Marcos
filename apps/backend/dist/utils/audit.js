"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
const db_js_1 = __importDefault(require("../config/db.js"));
async function createAuditLog({ userId, action, details, ipAddress }) {
    try {
        await db_js_1.default.auditLog.create({
            data: {
                userId: userId || null,
                action,
                details,
                ipAddress: ipAddress || null,
            },
        });
    }
    catch (err) {
        console.error(`Failed to write audit log for action ${action}:`, err.message);
    }
}
