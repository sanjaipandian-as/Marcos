"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyTargetLimiter = exports.identifyIpLimiter = exports.sensitiveRateLimiter = exports.globalRateLimiter = void 0;
exports.rateLimiter = rateLimiter;
const redis_js_1 = __importDefault(require("../config/redis.js"));
const environment_js_1 = require("../config/environment.js");
// In-memory fallback rate limiter for when Redis is unavailable
const inMemoryCounters = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of inMemoryCounters) {
        if (now > val.expiresAt)
            inMemoryCounters.delete(key);
    }
}, 60_000);
function rateLimiter(options) {
    return async (req, res, next) => {
        // Bypass rate limiting in test or development environment
        if (environment_js_1.isDevOrTest) {
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
            // Fallback to in-memory rate limiting when Redis is unavailable
            console.error('Rate limit Redis error (falling back to in-memory):', error);
            const memKey = `${options.prefix}:${keyIdentifier}`;
            const now = Date.now();
            const entry = inMemoryCounters.get(memKey);
            if (entry && now < entry.expiresAt) {
                entry.count++;
                if (entry.count > options.max) {
                    return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
                }
            }
            else {
                inMemoryCounters.set(memKey, { count: 1, expiresAt: now + options.windowMs });
            }
            next();
        }
    };
}
// 300 requests per 15 minutes per IP
exports.globalRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
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
exports.identifyIpLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    prefix: 'identify-ip',
    keyGenerator: (req) => req.ip || 'unknown-ip',
});
exports.identifyTargetLimiter = rateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 5,
    prefix: 'identify-target',
    keyGenerator: (req) => {
        let identifier = req.body.identifier || 'unknown';
        // Use simple normalization if available
        if (identifier.includes('@')) {
            identifier = identifier.toLowerCase().trim();
        }
        return identifier;
    }
});
