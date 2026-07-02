"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("./config/db.js"));
async function main() {
    const user = await db_js_1.default.user.findUnique({
        where: { email: 'sanjaipandian.as@gmail.com' }
    });
    console.log('--- USER PROFILE ---');
    console.log(JSON.stringify(user, null, 2));
}
main()
    .catch(console.error)
    .finally(() => db_js_1.default.$disconnect());
