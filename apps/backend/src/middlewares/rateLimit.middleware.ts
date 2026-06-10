import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis.js';
import env from '../config/env.js';

interface RateLimitOptions {
  windowMs: number; // Window size in milliseconds
  max: number;      // Maximum number of requests allowed in the window
  prefix: string;   // Redis key prefix
  keyGenerator?: (req: Request) => string;
}

export function rateLimiter(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Bypass rate limiting in test or development environment
    if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
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

      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.pexpire(redisKey, options.windowMs);
      }

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
      // Fail open if Redis is down, but log
      console.error('Rate limit error:', error);
      next();
    }
  };
}

// 100 requests per 15 minutes per IP
export const globalRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
