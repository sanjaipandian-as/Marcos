import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import redis from '../config/redis.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import AuthService from '../services/auth.service.js';
import SmsService from '../services/sms.service.js';
import EmailService from '../services/email.service.js';
import crypto from 'crypto';
import { createAuditLog } from '../utils/audit.js';
import logger from '../utils/logger.js';

export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (/^91\d{10}$/.test(cleaned)) {
    return `+91${cleaned.substring(2)}`;
  }
  if (/^\+91\d{10}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^\+\d+$/.test(cleaned)) {
    return cleaned;
  }
  return cleaned;
}

// Register validator schema
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    phoneNumber: z.string(),
    password: z.string().min(6),
    fullName: z.string(),
    referredById: z.string().uuid().optional(),
    role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN', 'SUPERADMIN']).optional(),
  }),
});

// Login validator schema
export const loginSchema = z.object({
  body: z.object({
    email: z.string(), // Accepts both email or phone number
    password: z.string(),
  }),
});

// OTP send schema
export const otpSendSchema = z.object({
  body: z.object({
    phoneNumber: z.string().optional(),
    email: z.string().email().optional(),
  }).refine(data => data.phoneNumber || data.email, {
    message: 'Either phoneNumber or email is required',
    path: ['phoneNumber'],
  }),
});

// OTP verify schema
export const otpVerifySchema = z.object({
  body: z.object({
    phoneNumber: z.string().optional(),
    email: z.string().email().optional(),
    code: z.string().length(6),
    purpose: z.string().optional(),
  }).refine(data => data.phoneNumber || data.email, {
    message: 'Either phoneNumber or email is required',
    path: ['phoneNumber'],
  }),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

// Reset password schema
export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
    newPassword: z.string().min(6),
  }),
});

// Forgot password verification schema
export const verifyResetOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
  }),
});

// Update profile schema
export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(1).optional(),
    gender: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    fcmToken: z.string().optional().nullable(),
  }),
});

export class AuthController {
  /**
   * POST /auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phoneNumber, password, fullName, referredById, role } = req.body;

      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const cleanDigits = phoneNumber.replace(/[\s\-()]/g, '');
      const rawDigits = cleanDigits.startsWith('+91') ? cleanDigits.substring(3) : (cleanDigits.startsWith('91') ? cleanDigits.substring(2) : cleanDigits);
      const possiblePhoneNumbers = [phoneNumber, normalizedPhone, cleanDigits, rawDigits];

      // Check existence
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { phoneNumber: { in: possiblePhoneNumbers } }
          ],
        },
      });

      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Email or Phone Number already registered' });
      }

      const passwordHash = await hashPassword(password);
      
      // Generate unique referral code
      const referralCode = `REF-${fullName.replace(/\s+/g, '').toUpperCase().substring(0, 5)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const user = await prisma.user.create({
        data: {
          email,
          phoneNumber: normalizedPhone,
          passwordHash,
          fullName,
          referralCode,
          referredById,
          role: role || 'CUSTOMER',
        },
      });

      // Generate access token
      const accessToken = AuthService.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      });

      await createAuditLog({
        userId: user.id,
        action: 'USER_REGISTERED',
        ipAddress: req.ip,
        details: {
          message: `New user account created via email/phone: ${user.email} (Role: ${user.role})`,
          email: user.email,
          phoneNumber: user.phoneNumber,
          registrationMethod: 'email',
        },
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    const clientType = req.headers['x-client-type'] as string || 'web'; // Determine cookie vs body

    try {
      let possiblePhoneNumbers = [email];
      if (!email.includes('@')) {
        const normalized = normalizePhoneNumber(email);
        const clean = email.replace(/[\s\-()]/g, '');
        const raw = clean.startsWith('+91') ? clean.substring(3) : (clean.startsWith('91') ? clean.substring(2) : clean);
        possiblePhoneNumbers = [email, normalized, clean, raw];
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { phoneNumber: { in: possiblePhoneNumbers } }
          ]
        }
      });
      if (!user) {
        await AuthController.trackFailedLogin(email, req.ip || 'unknown');
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        await AuthController.trackFailedLogin(email, req.ip || 'unknown');
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Successful login - clear failed login counter
      await redis.del(`failed_login:${email}`);
      await redis.del(`failed_login_ip:${req.ip}`);

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      };

      const accessToken = AuthService.generateAccessToken(payload);
      const refreshToken = await AuthService.generateRefreshToken(user.id);

      if (clientType === 'web' || user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
        // Set secure Cookie for Web Clients / Admin Panel
        res.cookie('refreshToken', refreshToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(200).json({
          success: true,
          accessToken,
          user: payload,
        });
      } else {
        // Return in body for Mobile Clients
        return res.status(200).json({
          success: true,
          accessToken,
          refreshToken,
          user: payload,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper to track failed login counts and trigger warnings
   */
  private static async trackFailedLogin(email: string, ip: string) {
    const keyEmail = `failed_login:${email}`;
    const keyIp = `failed_login_ip:${ip}`;

    const countEmail = await redis.incr(keyEmail);
    const countIp = await redis.incr(keyIp);

    if (countEmail === 1) await redis.expire(keyEmail, 60);
    if (countIp === 1) await redis.expire(keyIp, 60);

    await createAuditLog({
      action: 'FAILED_LOGIN',
      ipAddress: ip,
      details: {
        message: `Failed login attempt for identifier: ${email}`,
        identifier: email,
        timestamp: new Date().toISOString(),
      },
    });

    if (countEmail > 10 || countIp > 10) {
      // Trigger warning into audit logs
      await createAuditLog({
        action: 'FAILED_LOGIN_ALERT',
        ipAddress: ip,
        details: {
          message: `More than 10 failed login attempts triggered. Email: ${email}, IP: ${ip}`,
          email,
          ip,
        },
      });
    }
  }

  /**
   * POST /auth/otp/send
   */
  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    const { phoneNumber, email } = req.body;
    const identifier = phoneNumber ? normalizePhoneNumber(phoneNumber) : email;

    try {
      // 1. Check if the identifier is blocked (from failed verifications or hourly limit)
      const isBlocked = await redis.get(`cooldown:otp:${identifier}`);
      if (isBlocked) {
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests or validations failed. Please try again later.',
        });
      }

      // 2. Enforce a strict 60-second request cooldown to prevent instant spamming
      const sendCooldown = await redis.get(`cooldown:send:otp:${identifier}`);
      if (sendCooldown) {
        return res.status(429).json({
          success: false,
          message: 'Please wait 60 seconds before requesting another verification code.',
        });
      }

      // 3. Enforce an hourly request limit (max 5 requests per hour)
      const hourKey = `otp_count:${identifier}`;
      const count = await redis.incr(hourKey);
      if (count === 1) {
        await redis.expire(hourKey, 3600); // 1 hour TTL
      }
      if (count > 5) {
        // Block user for 24 hours if they trigger excessive OTPs
        await redis.set(`cooldown:otp:${identifier}`, 'blocked', 'EX', 86400);
        await redis.del(hourKey);
        await createAuditLog({
          action: 'OTP_IDENTIFIER_LOCKED',
          ipAddress: req.ip,
          details: {
            message: `OTP identifier locked out for 24 hours due to excessive OTP requests: ${identifier}`,
            identifier,
            reason: 'Excessive OTP requests (hourly limit exceeded)',
            duration: '24 hours',
          },
        });
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. This identifier has been locked out for 24 hours.',
        });
      }

      // Generate 6 digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

      // Save to Redis with 5 minutes TTL
      await redis.set(`otp:${identifier}`, hashedCode, 'EX', 300);

      // Send OTP via SMS or Email (asynchronously in background to prevent client loading hangs)
      if (phoneNumber) {
        SmsService.sendSms(identifier, `Your MARCOS verification code is ${code}. Valid for 5 minutes.`).catch(err => {
          logger.error('Failed to send SMS OTP in background', { metadata: { error: err.message } });
        });
      }
      if (email) {

        const emailHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 40px 20px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #eaeaea; text-align: left;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #111111, #333333); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">MARCOS</h1>
                <p style="color: #aaaaaa; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Secure Authorization</p>
              </div>
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #222222; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Hello,</h2>
                <p style="color: #555555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                  A request has been made to log in or verify your identity with **MARCOS Studio**. Please use the secure one-time verification code (OTP) below to complete your sign-in.
                </p>
                
                <!-- OTP Box -->
                <div style="background-color: #f4f6f8; border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 30px; border: 1px solid #eef2f5;">
                  <span style="display: block; color: #777777; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Verification Code</span>
                  <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #111111; letter-spacing: 6px; display: inline-block;">${code}</span>
                </div>

                <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 0 0 20px 0;">
                  This code is highly sensitive and is valid for the next **5 minutes**. For your own security, do not share this code with anyone, including the MARCOS support team.
                </p>
                <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 0;">
                  If you did not request this code, you can safely ignore this email. Your account remains secure.
                </p>
              </div>
              <!-- Footer -->
              <div style="background-color: #f4f6f8; padding: 25px 30px; text-align: center; border-top: 1px solid #eaeaea;">
                <p style="color: #222222; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">MARCOS Bespoke Tailoring Studio</p>
                <p style="color: #888888; font-size: 12px; margin: 0 0 15px 0;">Premium Customized Design & Fittings</p>
                <p style="color: #bbbbbb; font-size: 11px; margin: 0; line-height: 1.4;">
                  This is an automated security transmission. Please do not reply directly to this email.<br />
                  &copy; 2026 MARCOS Studio. All Rights Reserved.
                </p>
              </div>
            </div>
          </div>
        `;
        EmailService.sendEmail(
          email, 
          'Your MARCOS Verification Code', 
          `Your MARCOS OTP is: ${code}`,
          emailHtml
        ).catch(err => {
          logger.error('Failed to send Email OTP in background', { metadata: { error: err.message } });
        });
      }

      // Set 60-second request cooldown on success
      await redis.set(`cooldown:send:otp:${identifier}`, 'active', 'EX', 60);

      return res.status(200).json({ success: true, message: 'Verification code sent successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/otp/verify
   */
  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    const { phoneNumber, email, code, purpose } = req.body;
    const identifier = phoneNumber ? normalizePhoneNumber(phoneNumber) : email;
    const clientType = req.headers['x-client-type'] as string || 'web';

    try {
      // Check cooldown block
      const isBlocked = await redis.get(`cooldown:otp:${identifier}`);
      if (isBlocked) {
        return res.status(429).json({ success: false, message: 'Identifier temporarily locked out. Try again later.' });
      }

      const storedHash = await redis.get(`otp:${identifier}`);
      const hashedIncoming = crypto.createHash('sha256').update(code).digest('hex');

      if (!storedHash || storedHash !== hashedIncoming) {
        // Verify failure - track count
        const failKey = `otp_fail:${identifier}`;
        const attempts = await redis.incr(failKey);
        
        if (attempts === 1) await redis.expire(failKey, 900); // 15 mins tracking

        if (attempts >= 3) {
          // Block identifier for 15 minutes
          await redis.set(`cooldown:otp:${identifier}`, 'blocked', 'EX', 900);
          await redis.del(failKey);
          await createAuditLog({
            action: 'OTP_IDENTIFIER_LOCKED',
            ipAddress: req.ip,
            details: {
              message: `OTP identifier locked out for 15 minutes due to consecutive incorrect attempts: ${identifier}`,
              identifier,
              reason: 'Too many incorrect OTP verification attempts',
              duration: '15 minutes',
            },
          });
          return res.status(429).json({
            success: false,
            message: 'Too many incorrect OTP attempts. You are locked out for 15 minutes.',
          });
        }

        return res.status(400).json({
          success: false,
          message: `Invalid verification code. ${3 - attempts} attempts remaining before cooldown.`,
        });
      }

      // SUCCESS: Clear OTP keys & failures
      await redis.del(`otp:${identifier}`);
      await redis.del(`otp_fail:${identifier}`);

      // Fetch user profile or register new guest if needed (for simplicity, we assume user is already registered)
      let user = null;
      if (phoneNumber) {
        const normalized = normalizePhoneNumber(phoneNumber);
        const clean = phoneNumber.replace(/[\s\-()]/g, '');
        const raw = clean.startsWith('+91') ? clean.substring(3) : (clean.startsWith('91') ? clean.substring(2) : clean);
        user = await prisma.user.findFirst({
          where: {
            phoneNumber: { in: [phoneNumber, normalized, clean, raw] }
          }
        });
      } else if (email) {
        user = await prisma.user.findFirst({
          where: { email },
        });
      }

      if (purpose === 'register') {
        if (user) {
          return res.status(400).json({
            success: false,
            message: 'Email or Phone Number already registered. Please login instead.',
          });
        }
        return res.status(200).json({
          success: true,
          message: 'OTP verified successfully.',
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Verification complete, but no user profile matches this phone/email. Please register first.',
        });
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      };

      const accessToken = AuthService.generateAccessToken(payload);
      const refreshToken = await AuthService.generateRefreshToken(user.id);

      if (clientType === 'web' || user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
        res.cookie('refreshToken', refreshToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ success: true, accessToken, user: payload });
      } else {
        return res.status(200).json({ success: true, accessToken, refreshToken, user: payload });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/refresh
   */
  static async refresh(req: Request, res: Response, next: NextFunction) {
    let token = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];

    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    try {
      const { accessToken, refreshToken: newRefreshToken, user } = await AuthService.rotateTokens(token);
      const clientType = req.headers['x-client-type'] as string || 'web';

      if (clientType === 'web' || user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
        res.cookie('refreshToken', newRefreshToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ success: true, accessToken, user });
      } else {
        return res.status(200).json({ success: true, accessToken, refreshToken: newRefreshToken, user });
      }
    } catch (error: any) {
      return res.status(401).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /auth/logout
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
    const authHeader = req.headers.authorization;

    try {
      if (token) {
        await AuthService.logoutRefreshToken(token);
      }

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.split(' ')[1];
        await AuthService.blacklistAccessToken(accessToken);
      }

      res.clearCookie('refreshToken', { path: '/' });
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      
      await createAuditLog({
        userId: user ? user.id : null,
        action: 'PASSWORD_RESET_REQUESTED',
        ipAddress: req.ip,
        details: {
          message: `Password reset requested for email: ${email}`,
          email,
        },
      });

      if (!user) {
        // Return success message to prevent user enumeration
        return res.status(200).json({ success: true, message: 'If that email exists, a reset code has been sent.' });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

      // Save to Redis (5 mins TTL)
      await redis.set(`reset_otp:${email}`, hashedCode, 'EX', 300);

      // Send via email (premium layout)
      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 40px 20px; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #eaeaea; text-align: left;">
            <div style="background: linear-gradient(135deg, #e056fd, #be2edd); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">MARCOS</h1>
              <p style="color: #ffffff; opacity: 0.8; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Password Reset Request</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #222222; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Hello ${user.fullName},</h2>
              <p style="color: #555555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset your password for your MARCOS Studio account. Please use the secure verification code (OTP) below to complete your reset.
              </p>
              
              <div style="background-color: #f4f6f8; border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 30px; border: 1px solid #eef2f5;">
                <span style="display: block; color: #777777; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Reset Code</span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #be2edd; letter-spacing: 6px; display: inline-block;">${code}</span>
              </div>

              <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 0 0 20px 0;">
                This reset code is valid for **5 minutes**. For security reasons, never share this code with anyone.
              </p>
            </div>
            <div style="background-color: #f4f6f8; padding: 25px 30px; text-align: center; border-top: 1px solid #eaeaea;">
              <p style="color: #222222; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">MARCOS Bespoke Tailoring Studio</p>
              <p style="color: #bbbbbb; font-size: 11px; margin: 0;">&copy; 2026 MARCOS Studio. All Rights Reserved.</p>
            </div>
          </div>
        </div>
      `;

      EmailService.sendEmail(email, 'Reset Your MARCOS Password', `Your password reset code is: ${code}`, emailHtml).catch(err => {
        logger.error('Failed to send Reset Password email in background', { metadata: { error: err.message } });
      });

      return res.status(200).json({ success: true, message: 'If that email exists, a reset code has been sent.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/forgot-password/verify
   */
  static async verifyResetOtp(req: Request, res: Response, next: NextFunction) {
    const { email, code } = req.body;

    try {
      const storedHash = await redis.get(`reset_otp:${email}`);
      const hashedIncoming = crypto.createHash('sha256').update(code).digest('hex');

      if (!storedHash || storedHash !== hashedIncoming) {
        return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
      }

      return res.status(200).json({ success: true, message: 'Reset code verified successfully.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/reset-password
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    const { email, code, newPassword } = req.body;

    try {
      const storedHash = await redis.get(`reset_otp:${email}`);
      const hashedIncoming = crypto.createHash('sha256').update(code).digest('hex');

      if (!storedHash || storedHash !== hashedIncoming) {
        return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
      }

      // Successful verification - delete OTP and update password
      await redis.del(`reset_otp:${email}`);
      const passwordHash = await hashPassword(newPassword);

      await prisma.user.update({
        where: { email },
        data: { passwordHash },
      });

      return res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const [user, orderCount, rewardCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            fullName: true,
            gender: true,
            address: true,
            fcmToken: true,
            role: true,
            pointsBalance: true,
            referralCode: true,
            createdAt: true,
            pointTransactions: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
            referrals: {
              select: {
                fullName: true,
                createdAt: true,
              },
            },
          },
        }),
        prisma.order.count({ where: { userId } }),
        prisma.pointTransaction.count({ 
          where: { 
            userId,
            points: { gt: 0 } // Rewards are positive point transactions
          } 
        })
      ]);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // Merge stats into the user data object
      const userData = {
        ...user,
        stats: {
          orders: orderCount,
          rewards: rewardCount,
        }
      };

      return res.status(200).json({ success: true, data: userData });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /auth/profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    const { fullName, gender, address, fcmToken } = req.body;

    try {
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          fullName,
          gender,
          address,
          fcmToken,
        },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          fullName: true,
          gender: true,
          address: true,
          fcmToken: true,
          role: true,
          pointsBalance: true,
          referralCode: true,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'USER_PROFILE_UPDATED',
        ipAddress: req.ip,
        details: {
          message: `User ${req.user!.fullName} updated their profile fields`,
          updatedFields: { fullName, gender, address, fcmToken },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /auth/delete-account
   * Customer self-service account deletion
   */
  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      await prisma.user.delete({
        where: { id: req.user!.id },
      });

      await createAuditLog({
        userId: null,
        action: 'ACCOUNT_DELETED',
        ipAddress: req.ip,
        details: {
          message: `User ${user.email} deleted their own account.`,
          deletedUserId: user.id,
          deletedBy: 'self',
          finalValues: {
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Your account has been deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
