import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import redis from '../src/config/redis.js';
import { Role } from '@prisma/client';
import { hashPassword } from '../src/utils/crypto.js';
import { EmailService } from '../src/services/email.service.js';

const mockSendEmail = EmailService.sendEmail as any;

describe('MARCOS Backend - Extended Features & OTP Security', () => {
  let adminToken: string;
  let customerToken: string;
  let adminUser: any;
  let customerUser: any;
  let testCategoryId: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    await redis.del('ratelimit:sensitive:admin.new@marcosapp.com');
    await redis.del('cooldown:sensitive:admin.new@marcosapp.com');
    await redis.del('ratelimit:sensitive:customer.new@marcosapp.com');
    await redis.del('cooldown:sensitive:customer.new@marcosapp.com');

    // 1. Create test accounts
    const hashed = await hashPassword('SecurePassword123!');
    
    adminUser = await prisma.user.create({
      data: {
        email: 'admin.new@marcosapp.com',
        phoneNumber: '+919500000001',
        passwordHash: hashed,
        fullName: 'Admin User',
        role: Role.ADMIN,
        referralCode: 'REF-ADMIN-NEW',
      },
    });

    customerUser = await prisma.user.create({
      data: {
        email: 'customer.new@marcosapp.com',
        phoneNumber: '+919500000002',
        passwordHash: hashed,
        fullName: 'Customer User',
        role: Role.CUSTOMER,
        referralCode: 'REF-CUSTOMER-NEW',
      },
    });

    // Login to obtain tokens
    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Client-Type', 'mobile')
      .send({ email: adminUser.email, password: 'SecurePassword123!' });
    adminToken = loginAdmin.body.accessToken;

    const loginCust = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Client-Type', 'mobile')
      .send({ email: customerUser.email, password: 'SecurePassword123!' });
    customerToken = loginCust.body.accessToken;

    // Create a base category
    const category = await prisma.category.create({
      data: {
        name: 'Suits Test',
        slug: 'suits-test',
        order: 1,
      },
    });
    testCategoryId = category.id;
  });

  /* -------------------------------------------------------------
   * 1. OTP Cooldown & Lockout Security
   * ------------------------------------------------------------- */
  describe('OTP Security', () => {
    const testEmail = 'otp.sec@marcosapp.com';

    test('60-second send cooldown and hourly max request lockout', async () => {
      // First Send -> should succeed
      const res1 = await request(app)
        .post('/api/v1/auth/otp/send')
        .send({ email: testEmail });
      expect(res1.status).toBe(200);

      // Second Send immediately -> should fail with 429 Cooldown
      const res2 = await request(app)
        .post('/api/v1/auth/otp/send')
        .send({ email: testEmail });
      expect(res2.status).toBe(429);
      expect(res2.body.message).toContain('60 seconds');

      // Clear the 60s cooldown in Redis to test hourly limit
      await redis.del(`cooldown:send:otp:${testEmail}`);
      await redis.del(`ratelimit:sensitive:${testEmail}`);
      await redis.del(`cooldown:sensitive:${testEmail}`);

      // Loop to reach 5 requests
      for (let i = 2; i <= 5; i++) {
        await redis.del(`cooldown:send:otp:${testEmail}`);
        await redis.del(`ratelimit:sensitive:${testEmail}`);
        await redis.del(`cooldown:sensitive:${testEmail}`);
        const resLoop = await request(app)
          .post('/api/v1/auth/otp/send')
          .send({ email: testEmail });
        expect(resLoop.status).toBe(200);
      }

      // 6th request should hit 24-hour lockout
      await redis.del(`cooldown:send:otp:${testEmail}`);
      await redis.del(`ratelimit:sensitive:${testEmail}`);
      await redis.del(`cooldown:sensitive:${testEmail}`);
      const resLockout = await request(app)
        .post('/api/v1/auth/otp/send')
        .send({ email: testEmail });
      expect(resLockout.status).toBe(429);
      expect(resLockout.body.message).toContain('locked out for 24 hours');
    });
  });

  /* -------------------------------------------------------------
   * 2. Forgot Password & Profile APIs
   * ------------------------------------------------------------- */
  describe('Forgot/Reset Password & Profile Details', () => {
    test('Forgot and Reset password flow', async () => {
      // 1. Trigger forgot password
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: customerUser.email });
      
      expect(forgotRes.status).toBe(200);
      expect(mockSendEmail).toHaveBeenCalled();

      // Extract code from email mock
      const emailContent = mockSendEmail.mock.calls[0][2];
      const codeMatch = emailContent.match(/\b\d{6}\b/);
      expect(codeMatch).toBeTruthy();
      const resetCode = codeMatch[0];

      // 2. Reset password
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: customerUser.email,
          code: resetCode,
          newPassword: 'BrandNewPassword123!',
        });
      
      expect(resetRes.status).toBe(200);

      // Verify login with new password succeeds
      const newLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: customerUser.email, password: 'BrandNewPassword123!' });
      expect(newLogin.status).toBe(200);
    });

    test('GET and PUT Profile', async () => {
      // 1. Get profile
      const getRes = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${customerToken}`);
      
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.email).toBe(customerUser.email);

      // 2. Update profile
      const updateRes = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Jane Smith Updated',
          gender: 'Female',
          address: '456 Updated Lane, Bangalore',
        });
      
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.fullName).toBe('Jane Smith Updated');
      expect(updateRes.body.data.gender).toBe('Female');
    });
  });

  /* -------------------------------------------------------------
   * 3. Admin Product Management
   * ------------------------------------------------------------- */
  describe('Admin Product Operations', () => {
    let productId: string;

    test('Create, Update, Trending, and Delete Product', async () => {
      // 1. Create Product
      const createRes = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Classic Tuxedo Black',
          description: 'A premium wool tuxedo.',
          price: 50000,
          categoryId: testCategoryId,
          inventoryQty: 12,
        });

      expect(createRes.status).toBe(201);
      productId = createRes.body.data.id;
      expect(createRes.body.data.stockStatus).toBe('IN_STOCK');

      // 2. Update Product
      const updateRes = await request(app)
        .put(`/api/v1/admin/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          inventoryQty: 3, // LOW_STOCK status trigger
        });
      
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.stockStatus).toBe('LOW_STOCK');

      // 3. Toggle Trending
      const trendingRes = await request(app)
        .put(`/api/v1/admin/products/${productId}/trending`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isTrending: true,
        });
      
      expect(trendingRes.status).toBe(200);
      expect(trendingRes.body.data.isTrending).toBe(true);

      // 4. Delete Product
      const deleteRes = await request(app)
        .delete(`/api/v1/admin/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteRes.status).toBe(200);
    });
  });

  /* -------------------------------------------------------------
   * 4. Admin Category Operations
   * ------------------------------------------------------------- */
  describe('Admin Category Operations', () => {
    let catId: string;

    test('Create, Update, Reorder, and Delete Category', async () => {
      // 1. Create Category
      const createRes = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Blazers Custom',
          slug: 'blazers-custom',
          order: 2,
        });
      
      expect(createRes.status).toBe(201);
      catId = createRes.body.data.id;

      // 2. Update Category
      const updateRes = await request(app)
        .put(`/api/v1/admin/categories/${catId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Premium Custom Blazers',
        });
      expect(updateRes.status).toBe(200);

      // 3. Reorder Categories
      const reorderRes = await request(app)
        .put('/api/v1/admin/categories/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categories: [
            { id: catId, order: 10 },
            { id: testCategoryId, order: 11 },
          ],
        });
      expect(reorderRes.status).toBe(200);

      // 4. Delete Category
      const deleteRes = await request(app)
        .delete(`/api/v1/admin/categories/${catId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteRes.status).toBe(200);
    });

    test('Public categories listing GET /api/v1/categories', async () => {
      const listRes = await request(app)
        .get('/api/v1/categories');
      
      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data.some((c: any) => c.id === testCategoryId)).toBe(true);
    });
  });

  /* -------------------------------------------------------------
   * 5. Banner Management Module
   * ------------------------------------------------------------- */
  describe('Banner Management Module', () => {
    let bannerId: string;

    test('Public and Admin Banner Actions', async () => {
      // 1. Create Banner
      const createRes = await request(app)
        .post('/api/v1/banners/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          imageUrl: 'https://mock-image/banner1.jpg',
          title: 'Bridal Collection',
          location: 'HOME_SLIDER',
        });
      
      expect(createRes.status).toBe(201);
      bannerId = createRes.body.data.id;

      // 2. Get Public Banners
      const getPublic = await request(app)
        .get('/api/v1/banners')
        .query({ location: 'HOME_SLIDER' });
      expect(getPublic.status).toBe(200);
      expect(getPublic.body.data.length).toBeGreaterThan(0);

      // 3. Increment Click
      const clickRes = await request(app)
        .post(`/api/v1/banners/${bannerId}/click`);
      expect(clickRes.status).toBe(200);

      // 4. Delete Banner
      const deleteRes = await request(app)
        .delete(`/api/v1/banners/admin/${bannerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteRes.status).toBe(200);
    });
  });

  /* -------------------------------------------------------------
   * 6. Support Tickets
   * ------------------------------------------------------------- */
  describe('Customer Support Ticket Operations', () => {
    let ticketId: string;

    test('Raise and Resolve Ticket', async () => {
      // 1. Create Ticket
      const createRes = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subject: 'Delivery Delay Query',
          description: 'My order has not shipped yet.',
        });
      expect(createRes.status).toBe(201);
      ticketId = createRes.body.data.id;

      // 2. Customer Get Tickets
      const getCust = await request(app)
        .get('/api/v1/tickets')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(getCust.status).toBe(200);
      expect(getCust.body.data.length).toBeGreaterThan(0);

      // 3. Admin list tickets
      const adminList = await request(app)
        .get('/api/v1/tickets/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminList.status).toBe(200);
      expect(adminList.body.data.length).toBeGreaterThan(0);

      // 4. Admin Update Ticket status
      const updateRes = await request(app)
        .put(`/api/v1/tickets/admin/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RESOLVED',
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.status).toBe('RESOLVED');
    });
  });

  /* -------------------------------------------------------------
   * 7. Order Histories & Delivery Status Management
   * ------------------------------------------------------------- */
  describe('Order Histories & Status Updates', () => {
    let orderId: string;

    beforeEach(async () => {
      // Create product to checkout
      const product = await prisma.product.create({
        data: {
          name: 'Classic Blazer Grey',
          description: 'Custom fitted blazer.',
          price: 25000,
          categoryId: testCategoryId,
          inventoryQty: 10,
        },
      });

      // Checkout via admin invoice
      const invoice = await request(app)
        .post('/api/v1/billing/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: customerUser.id,
          items: [{ productId: product.id, quantity: 1, price: 25000 }],
          paymentMethod: 'ONLINE',
          isOfflineSales: false,
        });
      orderId = invoice.body.data.id;
    });

    test('Query and Update Orders', async () => {
      // 1. Customer Get Orders
      const getCustOrders = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(getCustOrders.status).toBe(200);
      expect(getCustOrders.body.data.length).toBeGreaterThan(0);

      // 2. Customer Get Order Detail
      const getCustDetail = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(getCustDetail.status).toBe(200);
      expect(getCustDetail.body.data.id).toBe(orderId);

      // 3. Admin List Orders
      const adminList = await request(app)
        .get('/api/v1/orders/admin/list')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminList.status).toBe(200);
      expect(adminList.body.data.length).toBeGreaterThan(0);

      // 4. Admin Update Status
      const updateStatus = await request(app)
        .put(`/api/v1/orders/admin/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'SHIPPED',
        });
      expect(updateStatus.status).toBe(200);
      expect(updateStatus.body.data.status).toBe('SHIPPED');

      // 5. Admin Get Packing Slip
      const slipRes = await request(app)
        .get(`/api/v1/orders/admin/${orderId}/packing-slip`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(slipRes.status).toBe(200);
      expect(slipRes.body.data.invoiceNumber).toBeDefined();
    });
  });

  /* -------------------------------------------------------------
   * 8. Admin Customer Registry
   * ------------------------------------------------------------- */
  describe('Admin Customer Registry Checks', () => {
    test('Registry List and Details', async () => {
      // 1. List
      const listRes = await request(app)
        .get('/api/v1/admin/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: customerUser.fullName });
      
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThan(0);

      // 2. Detail
      const detailRes = await request(app)
        .get(`/api/v1/admin/customers/${customerUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.email).toBe(customerUser.email);
    });
  });

  /* -------------------------------------------------------------
   * 9. Admin Notification Broadcasts
   * ------------------------------------------------------------- */
  describe('Notification Broadcasts', () => {
    test('Queues broadcast and targeted notifications', async () => {
      // 1. Broadcast
      const broadcastRes = await request(app)
        .post('/api/v1/notifications/admin/broadcast')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Mega Festive Discount Alert',
          body: 'Enjoy up to 50% discount on all custom blazers!',
          channels: ['EMAIL', 'PUSH'],
        });
      
      expect(broadcastRes.status).toBe(201);

      // 2. Targeted
      const targetRes = await request(app)
        .post('/api/v1/notifications/admin/send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userIds: [customerUser.id],
          title: 'Special Custom Alert',
          body: 'We updated your custom measurement metrics.',
          channels: ['EMAIL'],
        });
      
      expect(targetRes.status).toBe(201);
    });
  });

  /* -------------------------------------------------------------
   * 10. Extended Analytics Reports
   * ------------------------------------------------------------- */
  describe('Extended Reports Analytics', () => {
    test('Fetches chart groupings and alerts successfully', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.customerGrowth).toBeDefined();
      expect(res.body.data.productPerformance).toBeDefined();
      expect(res.body.data.lowStockAlerts).toBeDefined();
    });
  });

  /* -------------------------------------------------------------
   * 11. Production-Grade FCM & Twilio Mechanics
   * ------------------------------------------------------------- */
  describe('FCM Token Registration & Messaging Integration', () => {
    test('Can successfully register and update FCM token in user profile', async () => {
      const updateRes = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Jane Smith Updated',
          gender: 'Female',
          address: '456 Updated Lane, Bangalore',
          fcmToken: 'fcm-mock-device-token-123456',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.fcmToken).toBe('fcm-mock-device-token-123456');

      // Fetch profile to verify persistence
      const getRes = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.fcmToken).toBe('fcm-mock-device-token-123456');
    });
  });
});
