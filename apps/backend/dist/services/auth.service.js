"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const env_js_1 = __importDefault(require("../config/env.js"));
const redis_js_1 = __importDefault(require("../config/redis.js"));
const db_js_1 = __importDefault(require("../config/db.js"));
const client_1 = require("@prisma/client");
const email_service_js_1 = __importDefault(require("./email.service.js"));
class AuthService {
    // Access Token Lifespan: 15 minutes
    static ACCESS_TOKEN_EXPIRY = '15m';
    // Refresh Token Lifespan: 7 days (604800 seconds)
    static REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;
    /**
     * Generates a new access token
     */
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign({ ...payload }, env_js_1.default.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    }
    /**
     * Generates a new refresh token under a specific family or initializes a new family
     */
    static async generateRefreshToken(userId, familyId) {
        const activeFamilyId = familyId || (0, uuid_1.v4)();
        const token = (0, uuid_1.v4)(); // Generate a secure random token identifier
        const expiresAt = Math.floor(Date.now() / 1000) + this.REFRESH_TOKEN_TTL;
        const tokenData = {
            userId,
            familyId: activeFamilyId,
            revoked: false,
            expiresAt,
        };
        // Save to Redis
        await redis_js_1.default.set(`reftoken:${token}`, JSON.stringify(tokenData), 'EX', this.REFRESH_TOKEN_TTL);
        await redis_js_1.default.sadd(`reffamily:${activeFamilyId}`, token);
        await redis_js_1.default.expire(`reffamily:${activeFamilyId}`, this.REFRESH_TOKEN_TTL);
        return token;
    }
    /**
     * Performs Refresh Token Rotation (RTR).
     * Validates refresh token, invalidates token family on reuse detection, and returns new tokens.
     */
    static async rotateTokens(oldToken) {
        const dataStr = await redis_js_1.default.get(`reftoken:${oldToken}`);
        if (!dataStr) {
            throw new Error('Invalid or expired refresh token');
        }
        const data = JSON.parse(dataStr);
        // Reuse detection (Breach!)
        if (data.revoked) {
            await this.invalidateTokenFamily(data.familyId, data.userId);
            throw new Error('Security Alert: Refresh token reuse detected. Revoking token family.');
        }
        // Mark old token as revoked in Redis
        data.revoked = true;
        await redis_js_1.default.set(`reftoken:${oldToken}`, JSON.stringify(data), 'EX', this.REFRESH_TOKEN_TTL);
        // Fetch user details from Database
        const user = await db_js_1.default.user.findUnique({
            where: { id: data.userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        const payload = {
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
    static async invalidateTokenFamily(familyId, userId) {
        const tokens = await redis_js_1.default.smembers(`reffamily:${familyId}`);
        // Multi delete
        const pipeline = redis_js_1.default.pipeline();
        for (const token of tokens) {
            pipeline.del(`reftoken:${token}`);
        }
        pipeline.del(`reffamily:${familyId}`);
        await pipeline.exec();
        // Log security breach to AuditLog
        await db_js_1.default.auditLog.create({
            data: {
                userId,
                action: 'TOKEN_BREACH_DETECTED',
                details: {
                    message: `Security threat: Refresh token family ${familyId} for user ${userId} was invalidated due to reuse detection.`,
                    userId,
                    familyId,
                },
            },
        }).catch((err) => console.error('Failed to write breach audit log:', err));
        // Alert SuperAdmins
        try {
            const superAdmins = await db_js_1.default.user.findMany({
                where: { role: client_1.Role.SUPERADMIN },
            });
            for (const sa of superAdmins) {
                await email_service_js_1.default.sendEmail(sa.email, 'CRITICAL SECURITY ALERT: Revoked Refresh Token Reused', `Hello ${sa.fullName},\n\nA revoked refresh token was reused by user with ID ${userId}. The entire token family (${familyId}) has been invalidated to secure the account.`);
            }
        }
        catch (err) {
            console.error('Failed to alert SuperAdmins of token breach:', err.message);
        }
    }
    /**
     * Blacklists an access token (e.g. on logout)
     */
    static async blacklistAccessToken(token) {
        // Decipher payload to find remaining TTL
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (decoded && decoded.exp) {
                const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
                if (remainingTime > 0) {
                    await redis_js_1.default.set(`blacklist:${token}`, 'logged_out', 'EX', remainingTime);
                }
            }
        }
        catch (err) {
            // If token decoding fails, blacklist with 15 mins default
            await redis_js_1.default.set(`blacklist:${token}`, 'logged_out', 'EX', 900);
        }
    }
    /**
     * Log out refresh token
     */
    static async logoutRefreshToken(token) {
        const dataStr = await redis_js_1.default.get(`reftoken:${token}`);
        if (dataStr) {
            const data = JSON.parse(dataStr);
            await redis_js_1.default.del(`reftoken:${token}`);
            await redis_js_1.default.srem(`reffamily:${data.familyId}`, token);
        }
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;
