"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_js_1 = __importDefault(require("../config/env.js"));
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston_1.default.addColors(colors);
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), env_js_1.default.NODE_ENV === 'production'
    ? winston_1.default.format.json()
    : winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `[${info.timestamp}] [${info.level}]: ${info.message} ${info.metadata ? JSON.stringify(info.metadata) : ''}`)));
const transports = [
    new winston_1.default.transports.Console(),
];
exports.logger = winston_1.default.createLogger({
    level: env_js_1.default.NODE_ENV === 'production' ? 'info' : 'debug',
    levels,
    format,
    transports,
});
exports.default = exports.logger;
