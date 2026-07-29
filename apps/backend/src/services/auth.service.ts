import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import env from '../config/env.js';
import redis from '../config/redis.js';
import prisma from '../config/db.js';
import { Role } from '@prisma/client';
import EmailService from './email.service.js';

export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
  fullName: string;
}

export interface RefreshTokenData {
  userId: string;
  familyId: string;
  revoked: boolean;
  expiresAt: number;
}

export class AuthService {
  // Access Token Lifespan: 15 minutes
  private static ACCESS_TOKEN_EXPIRY = '15m';
  // Refresh Token Lifespan: 7 days (604800 seconds)
  private static REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

  /**
   * Generates a new access token
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign({ ...payload }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }

  /**
   * Generates a new refresh token under a specific family or initializes a new family
   */
  static async generateRefreshToken(userId: string, familyId?: string): Promise<string> {
    const activeFamilyId = familyId || uuidv4();
    const token = uuidv4(); // Generate a secure random token identifier

    const expiresAt = Math.floor(Date.now() / 1000) + this.REFRESH_TOKEN_TTL;

    const tokenData: RefreshTokenData = {
      userId,
      familyId: activeFamilyId,
      revoked: false,
      expiresAt,
    };

    // Save to Redis gracefully
    try {
      await redis.set(`reftoken:${token}`, JSON.stringify(tokenData), 'EX', this.REFRESH_TOKEN_TTL);
      await redis.sadd(`reffamily:${activeFamilyId}`, token);
      await redis.expire(`reffamily:${activeFamilyId}`, this.REFRESH_TOKEN_TTL);
      
      // Track all families for a user to allow global revocation
      await redis.sadd(`user_families:${userId}`, activeFamilyId);
      await redis.expire(`user_families:${userId}`, this.REFRESH_TOKEN_TTL);
    } catch (redisErr: any) {
      console.warn(`[Redis Warning] Failed to save refresh token to Redis: ${redisErr.message}`);
    }

    return token;
  }

  /**
   * Performs Refresh Token Rotation (RTR).
   * Validates refresh token, invalidates token family on reuse detection, and returns new tokens.
   */
  static async rotateTokens(oldToken: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const dataStr = await redis.get(`reftoken:${oldToken}`);
    if (!dataStr) {
      // Token not found in Redis — it either expired naturally or Redis was restarted/flushed.
      // This is NOT a security breach. Do NOT send a breach alert. Just ask user to login again.
      throw new Error('Session expired. Please log in again.');
    }

    const data: RefreshTokenData = JSON.parse(dataStr);

    try {
      // Reuse detection (Breach!) — only when token EXISTS in Redis but is explicitly marked revoked.
      // (If it doesn't exist, it's just expired naturally, so we don't trigger reuse detection).
      if (data.revoked) {
        await this.invalidateTokenFamily(data.familyId, data.userId);
        throw new Error('Token reuse detected. Family revoked.');
      }
      
      // Mark old token as revoked in Redis
      data.revoked = true;
      await redis.set(`reftoken:${oldToken}`, JSON.stringify(data), 'EX', this.REFRESH_TOKEN_TTL);
    } catch (redisErr: any) {
      if (redisErr.message.includes('Token reuse detected')) throw redisErr;
      console.warn(`[Redis Warning] Failed to check/revoke old token in Redis: ${redisErr.message}`);
    }

    // Fetch user details from Database
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const newAccessToken = this.generateAccessToken(payload);
    const newRefreshToken = await this.generateRefreshToken(user.id, data.familyId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }

  /**
   * Revokes all refresh tokens in a given family.
   */
  static async invalidateTokenFamily(familyId: string, userId: string) {
    try {
      const tokens = await redis.smembers(`reffamily:${familyId}`);
      if (tokens.length === 0) return;

      const pipeline = redis.pipeline();
      tokens.forEach((token: string) => {
        pipeline.del(`reftoken:${token}`);
        // Add all active tokens to blacklist immediately
        pipeline.set(`blacklist:${token}`, 'logged_out', 'EX', this.REFRESH_TOKEN_TTL);
      });
      pipeline.del(`reffamily:${familyId}`);
      await pipeline.exec();
    } catch (redisErr: any) {
      console.warn(`[Redis Warning] Failed to revoke token family: ${redisErr.message}`);
    }

    // Log security breach to AuditLog
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'TOKEN_BREACH_DETECTED',
        details: {
          message: `Security threat: Refresh token family ${familyId} for user ${userId} was invalidated due to reuse detection.`,
          userId,
          familyId,
        },
      },
    }).catch((err: any) => console.error('Failed to write breach audit log:', err));

    // Alert SuperAdmins
    try {
      const superAdmins = await prisma.user.findMany({
        where: { role: Role.SUPERADMIN },
      });

      for (const sa of superAdmins) {
        await EmailService.sendEmail(
          sa.email,
          'CRITICAL SECURITY ALERT: Revoked Refresh Token Reused',
          `Hello ${sa.fullName},\n\nA revoked refresh token was reused by user with ID ${userId}. The entire token family (${familyId}) has been invalidated to secure the account.`
        );
      }
    } catch (err: any) {
      console.error('Failed to alert SuperAdmins of token breach:', err.message);
    }
  }

  /**
   * Blacklists an access token (e.g. on logout)
   */
  static async blacklistAccessToken(token: string) {
    // Decipher payload to find remaining TTL
    try {
      const decoded = jwt.decode(token) as any;
      const remainingTime = decoded && decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0;
      
      if (remainingTime > 0) {
        await redis.set(`blacklist:${token}`, 'logged_out', 'EX', remainingTime);
      } else {
        await redis.set(`blacklist:${token}`, 'logged_out', 'EX', 900);
      }
    } catch (redisErr: any) {
      console.warn(`[Redis Warning] Failed to blacklist access token: ${redisErr.message}`);
    }
  }

  /**
   * Log out refresh token
   */
  static async logoutRefreshToken(token: string) {
    try {
      const dataStr = await redis.get(`reftoken:${token}`);
      if (dataStr) {
        const data: RefreshTokenData = JSON.parse(dataStr);
        await redis.del(`reftoken:${token}`);
        await redis.srem(`reffamily:${data.familyId}`, token);
      }
    } catch (redisErr: any) {
      console.warn(`[Redis Warning] Failed to revoke refresh token: ${redisErr.message}`);
    }
  }

  /**
   * Revoke all sessions for a specific user.
   */
  static async revokeAllUserSessions(userId: string) {
    try {
      const families = await redis.smembers(`user_families:${userId}`);
      for (const familyId of families) {
        // We do not want to trigger a breach alert on global logout, so we just invalidate tokens silently
        const tokens = await redis.smembers(`reffamily:${familyId}`);
        if (tokens.length > 0) {
          const pipeline = redis.pipeline();
          tokens.forEach((token: string) => {
            pipeline.del(`reftoken:${token}`);
            pipeline.set(`blacklist:${token}`, 'logged_out', 'EX', this.REFRESH_TOKEN_TTL);
          });
          pipeline.del(`reffamily:${familyId}`);
          await pipeline.exec();
        }
      }
      await redis.del(`user_families:${userId}`);
    } catch (redisErr: any) {
      console.warn(`[Redis Warning] Failed to revoke all sessions for user ${userId}: ${redisErr.message}`);
    }
  }
}

export default AuthService;
