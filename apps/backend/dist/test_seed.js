"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("./config/db.js"));
async function main() {
    console.log('Querying users from database...');
    const users = await db_js_1.default.user.findMany();
    console.log('Users found:', users.length);
    for (const u of users) {
        console.log(`- ${u.fullName} (${u.email}) ID: ${u.id}`);
    }
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
