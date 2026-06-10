"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_NAME = exports.connectionOptions = void 0;
const env_js_1 = __importDefault(require("../config/env.js"));
// Connection details derived from Redis URL
const url = new URL(env_js_1.default.REDIS_URL);
exports.connectionOptions = {
    host: url.hostname || '127.0.0.1',
    port: parseInt(url.port || '6379'),
    username: url.username || undefined,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
};
if (url.protocol === 'rediss:') {
    exports.connectionOptions.tls = {};
}
exports.QUEUE_NAME = 'marcos-jobs';
exports.default = exports.connectionOptions;
