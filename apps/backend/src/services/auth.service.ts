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

    // Save to Redis
    await redis.set(`reftoken:${token}`, JSON.stringify(tokenData), 'EX', this.REFRESH_TOKEN_TTL);
    await redis.sadd(`reffamily:${activeFamilyId}`, token);
    await redis.expire(`reffamily:${activeFamilyId}`, this.REFRESH_TOKEN_TTL);

    return token;
  }

  /**
   * Performs Refresh Token Rotation (RTR).
   * Validates refresh token, invalidates token family on reuse detection, and returns new tokens.
   */
  static async rotateTokens(oldToken: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const dataStr = await redis.get(`reftoken:${oldToken}`);
    if (!dataStr) {
      throw new Error('Invalid or expired refresh token');
    }

    const data: RefreshTokenData = JSON.parse(dataStr);

    // Reuse detection (Breach!)
    if (data.revoked) {
      await this.invalidateTokenFamily(data.familyId, data.userId);
      throw new Error('Security Alert: Refresh token reuse detected. Revoking token family.');
    }

    // Mark old token as revoked in Redis
    data.revoked = true;
    await redis.set(`reftoken:${oldToken}`, JSON.stringify(data), 'EX', this.REFRESH_TOKEN_TTL);

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
    const tokens = await redis.smembers(`reffamily:${familyId}`);
    
    // Multi delete
    const pipeline = redis.pipeline();
    for (const token of tokens) {
      pipeline.del(`reftoken:${token}`);
    }
    pipeline.del(`reffamily:${familyId}`);
    await pipeline.exec();

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
      if (decoded && decoded.exp) {
        const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
        if (remainingTime > 0) {
          await redis.set(`blacklist:${token}`, 'logged_out', 'EX', remainingTime);
        }
      }
    } catch (err) {
      // If token decoding fails, blacklist with 15 mins default
      await redis.set(`blacklist:${token}`, 'logged_out', 'EX', 900);
    }
  }

  /**
   * Log out refresh token
   */
  static async logoutRefreshToken(token: string) {
    const dataStr = await redis.get(`reftoken:${token}`);
    if (dataStr) {
      const data: RefreshTokenData = JSON.parse(dataStr);
      await redis.del(`reftoken:${token}`);
      await redis.srem(`reffamily:${data.familyId}`, token);
    }
  }
}

export default AuthService;
