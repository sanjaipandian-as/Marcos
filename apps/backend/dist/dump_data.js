"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("./config/db.js"));
async function main() {
    console.log("=== USERS ===");
    const users = await db_js_1.default.user.findMany({
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true
        }
    });
    console.table(users);
}
main().catch(console.error).finally(() => db_js_1.default.$disconnect());
