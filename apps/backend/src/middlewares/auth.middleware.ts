import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import redis from '../config/redis.js';
import prisma from '../config/db.js';
import { Role } from '@prisma/client';
import { createAuditLog } from '../utils/audit.js';

// In-memory cache for token blacklist checks to reduce Redis commands
// Tokens verified as NOT blacklisted are cached for 30 seconds
const blacklistCache = new Map<string, { isBlacklisted: boolean; expiresAt: number }>();
const BLACKLIST_CACHE_TTL = 30_000; // 30 seconds

// User existence cache — verified users are cached for 5 minutes
const userExistsCache = new Map<string, { exists: boolean; expiresAt: number }>();
const USER_CACHE_TTL = 300_000; // 5 minutes

// Periodically clean expired cache entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of blacklistCache) {
    if (now > value.expiresAt) {
      blacklistCache.delete(key);
    }
  }
  for (const [key, value] of userExistsCache) {
    if (now > value.expiresAt) {
      userExistsCache.delete(key);
    }
  }
}, 60_000); // Clean every 60 seconds

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Validate JWT access token and populate req.user
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Check in-memory cache first to avoid Redis call
    const cached = blacklistCache.get(token);
    const now = Date.now();
    
    if (cached && now < cached.expiresAt) {
      if (cached.isBlacklisted) {
        return res.status(401).json({ success: false, message: 'Token is blacklisted or expired' });
      }
      // Token is cached as NOT blacklisted — skip Redis
    } else {
      // Cache miss or expired — check Redis
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      
      // Cache the result
      blacklistCache.set(token, {
        isBlacklisted: !!isBlacklisted,
        expiresAt: now + BLACKLIST_CACHE_TTL,
      });
      
      if (isBlacklisted) {
        return res.status(401).json({ success: false, message: 'Token is blacklisted or expired' });
      }
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;
    
    // Verify user exists in database to prevent stale token/foreign key violations
    const userCacheKey = decoded.id;
    const cachedUser = userExistsCache.get(userCacheKey);
    const nowTime = Date.now();

    if (cachedUser && nowTime < cachedUser.expiresAt) {
      if (!cachedUser.exists) {
        return res.status(401).json({ success: false, message: 'User account no longer exists' });
      }
    } else {
      const userExists = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true } });
      userExistsCache.set(userCacheKey, {
        exists: !!userExists,
        expiresAt: nowTime + USER_CACHE_TTL,
      });
      if (!userExists) {
        return res.status(401).json({ success: false, message: 'User account no longer exists' });
      }
    }
    
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authorization token' });
  }
}

/**
 * Enforce roles (RBAC)
 */
export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      // Log unauthorized attempt
      createAuditLog({
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
