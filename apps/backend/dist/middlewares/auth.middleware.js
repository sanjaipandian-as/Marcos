"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = __importDefault(require("../config/env.js"));
const redis_js_1 = __importDefault(require("../config/redis.js"));
const db_js_1 = __importDefault(require("../config/db.js"));
const audit_js_1 = require("../utils/audit.js");
/**
 * Validate JWT access token and populate req.user
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authorization token required' });
        }
        const token = authHeader.split(' ')[1];
        // Check Redis blacklist
        const isBlacklisted = await redis_js_1.default.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return res.status(401).json({ success: false, message: 'Token is blacklisted or expired' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_js_1.default.JWT_ACCESS_SECRET);
        // Verify user exists in database to prevent stale token/foreign key violations
        const userExists = await db_js_1.default.user.findUnique({ where: { id: decoded.id } });
        if (!userExists) {
            return res.status(401).json({ success: false, message: 'User account no longer exists' });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired authorization token' });
    }
}
/**
 * Enforce roles (RBAC)
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (!roles.includes(req.user.role)) {
            // Log unauthorized attempt
            (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                ipAddress: req.ip,
                details: {
                    message: `User ${req.user.email} (Role: ${req.user.role}) attempted unauthorized access to endpoint ${req.originalUrl}`,
                    userId: req.user.id,
                    role: req.user.role,
                    targetPath: req.originalUrl,
                },
            });
            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
        }
        next();
    };
}
