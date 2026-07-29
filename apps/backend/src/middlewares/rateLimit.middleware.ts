import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis.js';
import { isDevOrTest } from '../config/environment.js';

interface RateLimitOptions {
  windowMs: number; // Window size in milliseconds
  max: number;      // Maximum number of requests allowed in the window
  prefix: string;   // Redis key prefix
  keyGenerator?: (req: Request) => string;
}

// In-memory fallback rate limiter for when Redis is unavailable
const inMemoryCounters = new Map<string, { count: number; expiresAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of inMemoryCounters) {
    if (now > val.expiresAt) inMemoryCounters.delete(key);
  }
}, 60_000);

export function rateLimiter(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Bypass rate limiting in test or development environment
    if (isDevOrTest) {
      return next();
    }

    const generator = options.keyGenerator || ((r) => r.ip || 'unknown-ip');
    const keyIdentifier = generator(req);
    const redisKey = `ratelimit:${options.prefix}:${keyIdentifier}`;

    try {
      // Check if cooldown/block exists
      const cooldownKey = `cooldown:${options.prefix}:${keyIdentifier}`;
      const isBlocked = await redis.get(cooldownKey);
      if (isBlocked) {
        return res.status(429).json({
          success: false,
          message: 'This identifier is temporarily locked out due to abuse or too many attempts. Please try again later.',
        });
      }

      const pipeline = redis.pipeline();
      pipeline.incr(redisKey);
      pipeline.pexpire(redisKey, options.windowMs);
      const results = await pipeline.exec();
      const count = results && results[0] && results[0][1] ? (results[0][1] as number) : 1;

      if (count > options.max) {
        // Automatically block for 15 minutes if it violates the sensitive rate limit threshold
        if (options.prefix === 'sensitive') {
          await redis.set(cooldownKey, 'blocked', 'EX', 900); // 15 mins block
        }
        
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
        });
      }

      next();
    } catch (error) {
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
      } else {
        inMemoryCounters.set(memKey, { count: 1, expiresAt: now + options.windowMs });
      }
      next();
    }
  };
}

// 1500 requests per 15 minutes per IP (for 10K concurrent users)
export const globalRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  prefix: 'global',
  keyGenerator: (req) => req.ip || 'unknown-ip',
});

// 5 requests per 15 minutes per IP/Phone/Email
export const sensitiveRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: 'sensitive',
  keyGenerator: (req) => {
    const identifier = req.body.phoneNumber || req.body.email || req.body.username || req.ip || 'unknown';
    return identifier;
  },
});

export const identifyIpLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  prefix: 'identify-ip',
  keyGenerator: (req) => req.ip || 'unknown-ip',
});

export const identifyTargetLimiter = rateLimiter({
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

