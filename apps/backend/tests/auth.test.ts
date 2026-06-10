import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import redis from '../src/config/redis.js';
import { hashPassword } from '../src/utils/crypto.js';
import { SmsService } from '../src/services/sms.service.js';
import { EmailService } from '../src/services/email.service.js';

const mockSendSms = SmsService.sendSms as any;
const mockSendEmail = EmailService.sendEmail as any;

describe('Authentication & Token Mechanics', () => {
  const registerPayload = {
    email: 'test@marcosapp.com',
    phoneNumber: '+919876543210',
    password: 'SecurePassword123!',
    fullName: 'Jane Doe',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /auth/register should create user and return accessToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(registerPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(registerPayload.email);

    // Verify user exists in db
    const user = await prisma.user.findUnique({ where: { email: registerPayload.email } });
    expect(user).toBeTruthy();
    expect(user?.referralCode).toContain('REF-JANE');
  });

  test('POST /auth/register validation failure', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'invalid-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  test('POST /auth/login should authenticate user and separate tokens (Cookie vs Body)', async () => {
    const hashed = await hashPassword(registerPayload.password);
    await prisma.user.create({
      data: {
        email: registerPayload.email,
        phoneNumber: registerPayload.phoneNumber,
        passwordHash: hashed,
        fullName: registerPayload.fullName,
        referralCode: 'REF-MOCK',
      },
    });

    // Web Login (Default)
    const resWeb = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Client-Type', 'web')
      .send({ email: registerPayload.email, password: registerPayload.password });

    expect(resWeb.status).toBe(200);
    expect(resWeb.body.success).toBe(true);
    expect(resWeb.body.accessToken).toBeDefined();
    expect(resWeb.body.refreshToken).toBeUndefined();
    expect(resWeb.headers['set-cookie']).toBeDefined();
    expect(resWeb.headers['set-cookie'][0]).toContain('refreshToken=');

    // Mobile Login
    const resMobile = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Client-Type', 'mobile')
      .send({ email: registerPayload.email, password: registerPayload.password });

    expect(resMobile.status).toBe(200);
    expect(resMobile.body.success).toBe(true);
    expect(resMobile.body.accessToken).toBeDefined();
    expect(resMobile.body.refreshToken).toBeDefined();
  });

  test('POST /auth/login failed attempts warning', async () => {
    // Run 11 failed attempts to trigger warning
    for (let i = 0; i < 11; i++) {
      await redis.del('ratelimit:sensitive:test@marcosapp.com');
      await redis.del('cooldown:sensitive:test@marcosapp.com');
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@marcosapp.com', password: 'wrong-password' });
      expect(res.status).toBe(401);
    }

    const log = await prisma.auditLog.findFirst({
      where: { action: 'FAILED_LOGIN_ALERT' },
    });
    expect(log).toBeTruthy();
    expect((log?.details as any).message).toContain('failed login attempts');
  });

  test('OTP rules: happy path verify, validation, 3 failed verification attempts blocks identifier for 15 minutes', async () => {
    const identifier = '+919999999999';

    // Register user first so verifyOtp has user record
    await prisma.user.create({
      data: {
        email: 'otp-user@marcosapp.com',
        phoneNumber: identifier,
        passwordHash: 'hash',
        fullName: 'OTP User',
        referralCode: 'REF-OTP',
      },
    });

    // 1. Send OTP
    const sendRes = await request(app)
      .post('/api/v1/auth/otp/send')
      .send({ phoneNumber: identifier });
    expect(sendRes.status).toBe(200);

    // Extract OTP from mock
    expect(mockSendSms).toHaveBeenCalled();
    const smsContent = mockSendSms.mock.calls[0][1];
    const codeMatch = smsContent.match(/\b\d{6}\b/);
    expect(codeMatch).toBeTruthy();
    const realCode = codeMatch[0];

    // 2. Validate incorrect OTP once
    const verifyFailRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phoneNumber: identifier, code: '000000' });
    expect(verifyFailRes.status).toBe(400);

    // 3. Verify OTP Happy Path
    const verifySuccessRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phoneNumber: identifier, code: realCode });
    expect(verifySuccessRes.status).toBe(200);
    expect(verifySuccessRes.body.success).toBe(true);
    expect(verifySuccessRes.body.accessToken).toBeDefined();

    // 4. Lockout test on new OTP requests
    const anotherIdentifier = '+918888888888';
    await request(app)
      .post('/api/v1/auth/otp/send')
      .send({ phoneNumber: anotherIdentifier });
    
    for (let i = 1; i <= 3; i++) {
      const verifyRes = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phoneNumber: anotherIdentifier, code: '000000' });
      
      if (i < 3) {
        expect(verifyRes.status).toBe(400);
      } else {
        expect(verifyRes.status).toBe(429);
        expect(verifyRes.body.message).toContain('locked out');
      }
    }

    // Try to send OTP again, should block with 429
    const secondSendRes = await request(app)
      .post('/api/v1/auth/otp/send')
      .send({ phoneNumber: anotherIdentifier });
    expect(secondSendRes.status).toBe(429);
  });

  test('Refresh Token Rotation (RTR): rotates token family & detects breach reuse', async () => {
    const hashed = await hashPassword(registerPayload.password);
    await prisma.user.create({
      data: {
        email: registerPayload.email,
        phoneNumber: registerPayload.phoneNumber,
        passwordHash: hashed,
        fullName: registerPayload.fullName,
        referralCode: 'REF-MOCK',
      },
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Client-Type', 'mobile')
      .send({ email: registerPayload.email, password: registerPayload.password });
    
    const firstRefreshToken = loginRes.body.refreshToken;
    expect(firstRefreshToken).toBeDefined();

    const rotateRes1 = await request(app)
      .post('/api/v1/auth/refresh')
      .set('X-Client-Type', 'mobile')
      .send({ refreshToken: firstRefreshToken });

    expect(rotateRes1.status).toBe(200);
    const secondRefreshToken = rotateRes1.body.refreshToken;
    expect(secondRefreshToken).toBeDefined();

    const rotateRes2 = await request(app)
      .post('/api/v1/auth/refresh')
      .set('X-Client-Type', 'mobile')
      .send({ refreshToken: firstRefreshToken });

    expect(rotateRes2.status).toBe(401);
    expect(rotateRes2.body.message).toContain('reuse detected');

    const rotateRes3 = await request(app)
      .post('/api/v1/auth/refresh')
      .set('X-Client-Type', 'mobile')
      .send({ refreshToken: secondRefreshToken });

    expect(rotateRes3.status).toBe(401);

    const logs = await prisma.auditLog.findMany({ where: { action: 'TOKEN_BREACH_DETECTED' } });
    expect(logs.length).toBe(1);
  });

  test('POST /auth/logout blacklists access token', async () => {
    const hashed = await hashPassword(registerPayload.password);
    const user = await prisma.user.create({
      data: {
        email: registerPayload.email,
        phoneNumber: registerPayload.phoneNumber,
        passwordHash: hashed,
        fullName: registerPayload.fullName,
        referralCode: 'REF-MOCK',
      },
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Client-Type', 'mobile')
      .send({ email: registerPayload.email, password: registerPayload.password });

    const { accessToken, refreshToken } = loginRes.body;

    // Call protected API before logout -> should succeed
    const preLogoutRes = await request(app)
      .get('/api/v1/measurements')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(preLogoutRes.status).toBe(200);

    // Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    // Call protected API after logout -> should be blocked
    const postLogoutRes = await request(app)
      .get('/api/v1/measurements')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(postLogoutRes.status).toBe(401);
    expect(postLogoutRes.body.message).toContain('blacklisted');
  });
});
