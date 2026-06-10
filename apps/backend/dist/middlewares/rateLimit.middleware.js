"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sensitiveRateLimiter = exports.globalRateLimiter = void 0;
exports.rateLimiter = rateLimiter;
const redis_js_1 = __importDefault(require("../config/redis.js"));
const env_js_1 = __importDefault(require("../config/env.js"));
function rateLimiter(options) {
    return async (req, res, next) => {
        // Bypass rate limiting in test or development environment
        if (env_js_1.default.NODE_ENV === 'test' || env_js_1.default.NODE_ENV === 'development') {
            return next();
        }
        const generator = options.keyGenerator || ((r) => r.ip || 'unknown-ip');
        const keyIdentifier = generator(req);
        const redisKey = `ratelimit:${options.prefix}:${keyIdentifier}`;
        try {
            // Check if cooldown/block exists
            const cooldownKey = `cooldown:${options.prefix}:${keyIdentifier}`;
            const isBlocked = await redis_js_1.default.get(cooldownKey);
            if (isBlocked) {
                return res.status(429).json({
                    success: false,
                    message: 'This identifier is temporarily locked out due to abuse or too many attempts. Please try again later.',
                });
            }
            const count = await redis_js_1.default.incr(redisKey);
            if (count === 1) {
                await redis_js_1.default.pexpire(redisKey, options.windowMs);
            }
            if (count > options.max) {
                // Automatically block for 15 minutes if it violates the sensitive rate limit threshold
                if (options.prefix === 'sensitive') {
                    await redis_js_1.default.set(cooldownKey, 'blocked', 'EX', 900); // 15 mins block
                }
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests. Please try again later.',
                });
            }
            next();
        }
        catch (error) {
            // Fail open if Redis is down, but log
            console.error('Rate limit error:', error);
            next();
        }
    };
}
// 100 requests per 15 minutes per IP
exports.globalRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    prefix: 'global',
    keyGenerator: (req) => req.ip || 'unknown-ip',
});
// 5 requests per 15 minutes per IP/Phone/Email
exports.sensitiveRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    prefix: 'sensitive',
    keyGenerator: (req) => {
        const identifier = req.body.phoneNumber || req.body.email || req.body.username || req.ip || 'unknown';
        return identifier;
    },
});
