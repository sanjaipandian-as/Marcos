"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_js_1 = __importDefault(require("./env.js"));
let redis;
if (env_js_1.default.NODE_ENV === 'test' || env_js_1.default.NODE_ENV === 'development') {
    // If we are in test or dev mode, use ioredis-mock to save real Redis commands
    // and prevent Upstash rate limiting issues.
    try {
        const RedisMock = require('ioredis-mock');
        exports.redis = redis = new RedisMock();
    }
    catch (err) {
        exports.redis = redis = new ioredis_1.default(env_js_1.default.REDIS_URL, {
            maxRetriesPerRequest: null,
        });
    }
}
else {
    exports.redis = redis = new ioredis_1.default(env_js_1.default.REDIS_URL, {
        maxRetriesPerRequest: null,
    });
}
redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
});
exports.default = redis;
