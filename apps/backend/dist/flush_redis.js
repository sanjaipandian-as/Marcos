"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_js_1 = __importDefault(require("./config/redis.js"));
async function main() {
    console.log("Flushing all keys in Redis...");
    await redis_js_1.default.flushall();
    console.log("Redis flushed successfully.");
    process.exit(0);
}
main().catch(console.error);
