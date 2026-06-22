"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = getIO;
exports.initSocket = initSocket;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = __importDefault(require("../config/env.js"));
const redis_js_1 = __importDefault(require("../config/redis.js"));
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const socket_adapter_js_1 = require("./socket.adapter.js");
const client_1 = require("@prisma/client");
let io = null;
function getIO() {
    return io;
}
function initSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: env_js_1.default.NODE_ENV === 'production'
                ? ['https://marcos-admin.vercel.app', 'https://marcos.app'] // Restrict to known origins in production
                : '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    // Attach Redis adapter for horizontal scaling ONLY in production
    // In development, the in-memory adapter works fine and avoids thousands of Redis commands/min
    if (env_js_1.default.NODE_ENV === 'production') {
        try {
            const adapter = (0, socket_adapter_js_1.createRedisAdapter)();
            io.adapter(adapter);
            logger_js_1.default.info('Socket.io Redis adapter attached (production mode).');
        }
        catch (err) {
            logger_js_1.default.error('Failed to attach Socket.io Redis adapter', { metadata: { error: err.message } });
        }
    }
    else {
        logger_js_1.default.info('Socket.io using in-memory adapter (development mode — Redis adapter skipped to save commands).');
    }
    // Handshake Token validation Middleware
    io.use(async (socket, next) => {
        const token = socket.handshake.query.token || socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token required'));
        }
        try {
            // Check Redis blacklist (matches HTTP auth middleware behavior)
            const isBlacklisted = await redis_js_1.default.get(`blacklist:${token}`);
            if (isBlacklisted) {
                return next(new Error('Authentication error: Token is blacklisted'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, env_js_1.default.JWT_ACCESS_SECRET);
            socket.data.user = decoded;
            next();
        }
        catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.data.user;
        logger_js_1.default.info(`Socket client connected: ${socket.id} (User: ${user.id}, Role: ${user.role})`);
        // 1. Join user to personal room
        socket.join(`user:${user.id}`);
        // 2. Join RBAC rooms
        if (user.role === client_1.Role.ADMIN || user.role === client_1.Role.SUPERADMIN) {
            socket.join('admins');
        }
        if (user.role === client_1.Role.SUPERADMIN) {
            socket.join('superadmins');
        }
        // Handlers
        socket.on('disconnect', () => {
            logger_js_1.default.info(`Socket client disconnected: ${socket.id} (User: ${user.id})`);
            // Socket.io automatically handles room cleanup, we just log and clean up any local states if tracked
        });
    });
    return io;
}
