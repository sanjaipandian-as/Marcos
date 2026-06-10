import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import redis from '../config/redis.js';
import prisma from '../config/db.js';
import { Role } from '@prisma/client';
import { createAuditLog } from '../utils/audit.js';

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
    
    // Check Redis blacklist
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ success: false, message: 'Token is blacklisted or expired' });
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;
    
    // Verify user exists in database to prevent stale token/foreign key violations
    const userExists = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!userExists) {
      return res.status(401).json({ success: false, message: 'User account no longer exists' });
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
