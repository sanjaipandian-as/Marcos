"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_js_1 = __importDefault(require("../utils/logger.js"));
exports.prisma = globalThis.prisma || new client_1.PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
    ],
});
// Log slow queries (>200ms)
exports.prisma.$on('query', (e) => {
    if (e.duration >= 200) {
        logger_js_1.default.warn(`🐌 Slow Query (${e.duration}ms): ${e.query} | Params: ${e.params}`);
    }
});
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = exports.prisma;
}
exports.default = exports.prisma;
