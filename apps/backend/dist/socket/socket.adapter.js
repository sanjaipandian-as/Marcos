"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisAdapter = createRedisAdapter;
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
const env_js_1 = __importDefault(require("../config/env.js"));
function createRedisAdapter() {
    const pubClient = new ioredis_1.default(env_js_1.default.REDIS_URL, {
        maxRetriesPerRequest: null,
    });
    const subClient = pubClient.duplicate();
    pubClient.on('error', (err) => {
        console.error('Redis Adapter pubClient Error:', err);
    });
    subClient.on('error', (err) => {
        console.error('Redis Adapter subClient Error:', err);
    });
    return (0, redis_adapter_1.createAdapter)(pubClient, subClient);
}
