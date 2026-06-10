"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.encryptText = encryptText;
exports.decryptText = decryptText;
const crypto_1 = __importDefault(require("crypto"));
const argon2_1 = __importDefault(require("argon2"));
const env_js_1 = __importDefault(require("../config/env.js"));
// The key must be a 32-byte string (e.g. 256 bits).
// We derive a buffer from the ENCRYPTION_KEY.
const getEncryptionKey = () => {
    const key = env_js_1.default.ENCRYPTION_KEY;
    if (key.length === 32) {
        return Buffer.from(key, 'utf-8');
    }
    // Fallback / hash key to make sure it's 32 bytes
    return crypto_1.default.createHash('sha256').update(key).digest();
};
/**
 * Hash password using Argon2id
 */
async function hashPassword(password) {
    return argon2_1.default.hash(password, {
        type: argon2_1.default.argon2id,
        memoryCost: 65536, // 64MB
        timeCost: 3,
        parallelism: 4,
    });
}
/**
 * Verify password using Argon2id
 */
async function verifyPassword(password, hash) {
    try {
        return await argon2_1.default.verify(hash, password);
    }
    catch (err) {
        return false;
    }
}
/**
 * Encrypt a text field using AES-256-GCM
 */
function encryptText(text) {
    try {
        const key = getEncryptionKey();
        const iv = crypto_1.default.randomBytes(12);
        const cipher = crypto_1.default.createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();
        // Structure: iv:tag:encrypted
        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    }
    catch (error) {
        throw new Error('Encryption failed');
    }
}
/**
 * Decrypt a text field using AES-256-GCM
 */
function decryptText(encryptedText) {
    try {
        const key = getEncryptionKey();
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            // Return plain text if it doesn't match GCM format (e.g., legacy or unencrypted fields)
            return encryptedText;
        }
        const iv = Buffer.from(parts[0], 'hex');
        const tag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto_1.default.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        // Return original if decryption fails (safeguard)
        return encryptedText;
    }
}
