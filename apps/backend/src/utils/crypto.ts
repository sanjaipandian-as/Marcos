import crypto from 'crypto';
import argon2 from 'argon2';
import env from '../config/env.js';

// The key must be a 32-byte string (e.g. 256 bits).
// We derive a buffer from the ENCRYPTION_KEY.
const getEncryptionKey = (): Buffer => {
  const key = env.ENCRYPTION_KEY;
  if (key.length === 32) {
    return Buffer.from(key, 'utf-8');
  }
  // Fallback / hash key to make sure it's 32 bytes
  return crypto.createHash('sha256').update(key).digest();
};

/**
 * Hash password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64MB
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verify password using Argon2id
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    return false;
  }
}

/**
 * Encrypt a text field using AES-256-GCM
 */
export function encryptText(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Structure: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt a text field using AES-256-GCM
 */
export function decryptText(encryptedText: string): string {
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
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Return original if decryption fails (safeguard)
    return encryptedText;
  }
}
