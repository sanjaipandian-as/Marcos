import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import AuthService from '../src/services/auth.service.js';
import { Role } from '@prisma/client';
import JobsProducer from '../src/queues/jobs.producer.js';
import env from '../src/config/env.js';
import crypto from 'crypto';
import http from 'http';
import { initSocket } from '../src/socket/socket.handler.js';

const mockQueueInvoicePdf = JobsProducer.queueInvoicePdf as jest.MockedFunction<any>;
const mockQueueCreditReferralPoints = JobsProducer.queueCreditReferralPoints as jest.MockedFunction<any>;

describe('Billing operations & Payment webhooks', () => {
  let customerToken: string;
  let staffToken: string;
  let customer: any;
  let staff: any;
  let category: any;
  let product: any;
  let server: http.Server;

  beforeAll((done) => {
    server = http.createServer();
    initSocket(server);
    server.listen(done);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    customer = await prisma.user.create({
      data: { email: 'c.bill@marcosapp.com', phoneNumber: '+917000000001', passwordHash: 'hash', fullName: 'Cust Bill', role: Role.CUSTOMER, referralCode: 'REF-CB' }
    });
    staff = await prisma.user.create({
      data: { email: 's.bill@marcosapp.com', phoneNumber: '+917000000002', passwordHash: 'hash', fullName: 'Staff Bill', role: Role.STAFF, referralCode: 'REF-SB' }
    });

    customerToken = AuthService.generateAccessToken(customer);
    staffToken = AuthService.generateAccessToken(staff);

    category = await prisma.category.create({
      data: { name: 'Formal', slug: 'formal' }
    });

    product = await prisma.product.create({
      data: {
        name: 'Tuxedo Suit',
        description: 'Black tie tuxedo',
        price: 300.00,
        inventoryQty: 15,
        stockStatus: 'IN_STOCK',
        categoryId: category.id,
      }
    });
  });

  test('POST /billing/invoice enforces staff/admin RBAC and triggers calculations, inventory shifts and job queueing', async () => {
    // 1. Customer attempts invoice creation -> 403 Forbidden
    const resCust = await request(app)
      .post('/api/v1/billing/invoice')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        userId: customer.id,
        items: [{ productId: product.id, quantity: 5, price: 300.00 }],
        discountAmount: 100.00,
        paymentMethod: 'CARD',
      });
    expect(resCust.status).toBe(403);

    // 2. Staff creates invoice -> 201 Created
    const resStaff = await request(app)
      .post('/api/v1/billing/invoice')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        userId: customer.id,
        items: [{ productId: product.id, quantity: 5, price: 300.00 }],
        discountAmount: 100.00,
        paymentMethod: 'CARD',
        isOfflineSales: true,
      });

    expect(resStaff.status).toBe(201);
    expect(resStaff.body.success).toBe(true);

    const order = resStaff.body.data;
    // Calculations check: subtotal = 1500, discount = 100, taxable = 1400. tax = 1400 * 0.18 = 252. grand total = 1652.
    expect(Number(order.totalAmount)).toBe(1500.00);
    expect(Number(order.taxAmount)).toBe(252.00);
    expect(Number(order.payableAmount)).toBe(1652.00);

    // 3. Inventory shifts check: 15 - 5 = 10. stockStatus should transition to LOW_STOCK (<= 10)
    const updatedProd = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProd?.inventoryQty).toBe(10);
    expect(updatedProd?.stockStatus).toBe('LOW_STOCK');

    // 4. Jobs queue check
    expect(mockQueueInvoicePdf).toHaveBeenCalledWith(order.id);
    expect(mockQueueCreditReferralPoints).toHaveBeenCalledWith(order.id, customer.id);
  });

  test('POST /billing/invoice fails when quantity is greater than stock', async () => {
    const res = await request(app)
      .post('/api/v1/billing/invoice')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        userId: customer.id,
        items: [{ productId: product.id, quantity: 20, price: 300.00 }], // only 15 available
        discountAmount: 0,
        paymentMethod: 'CARD',
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Insufficient inventory');
  });

  test('POST /billing/webhook/razorpay verifies signature and handles completed payment state updates', async () => {
    const order = await prisma.order.create({
      data: {
        userId: customer.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        totalAmount: 300.00,
        taxAmount: 54.00,
        discountAmount: 0,
        payableAmount: 354.00,
        paymentMethod: 'ONLINE',
        invoiceNumber: 'INV-WEBHOOK-TEST',
      }
    });

    const bodyPayload = JSON.stringify({
      payload: {
        payment: {
          entity: {
            id: 'pay_razorpay_998',
            notes: {
              orderId: order.id,
            },
          },
        },
      },
    });

    // Temporarily bypass test mode to test real HMAC logic
    const originalNodeEnv = env.NODE_ENV;
    const originalWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

    (env as any).NODE_ENV = 'production';
    (env as any).RAZORPAY_WEBHOOK_SECRET = 'secure-razor-secret';

    try {
      // 1. Send invalid signature -> 400 Bad Request
      const resInvalid = await request(app)
        .post('/api/v1/billing/webhook/razorpay')
        .set('x-razorpay-signature', 'invalid-hmac-hash')
        .set('Content-Type', 'application/json')
        .send(bodyPayload);
      expect(resInvalid.status).toBe(400);

      // Compute valid signature
      const validHmac = crypto
        .createHmac('sha256', 'secure-razor-secret')
        .update(bodyPayload)
        .digest('hex');

      // 2. Send valid signature -> 200 OK
      const resValid = await request(app)
        .post('/api/v1/billing/webhook/razorpay')
        .set('x-razorpay-signature', validHmac)
        .set('Content-Type', 'application/json')
        .send(bodyPayload);

      expect(resValid.status).toBe(200);

      // Verify DB Order updated to PAID
      const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(updatedOrder?.status).toBe('PAID');
      expect(updatedOrder?.paymentStatus).toBe('COMPLETED');
      expect(updatedOrder?.transactionId).toBe('pay_razorpay_998');

      // Verify jobs enqueued
      expect(mockQueueInvoicePdf).toHaveBeenCalledWith(order.id);
    } finally {
      (env as any).NODE_ENV = originalNodeEnv;
      (env as any).RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
    }
  });

  test('POST /billing/webhook/stripe webhook verified', async () => {
    const order = await prisma.order.create({
      data: {
        userId: customer.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        totalAmount: 300.00,
        taxAmount: 54.00,
        discountAmount: 0,
        payableAmount: 354.00,
        paymentMethod: 'ONLINE',
        invoiceNumber: 'INV-STRIPE-TEST',
      }
    });

    const bodyPayload = JSON.stringify({
      orderId: order.id,
      id: 'stripe-tx-999',
    });

    const res = await request(app)
      .post('/api/v1/billing/webhook/stripe')
      .set('Content-Type', 'application/json')
      .send(bodyPayload);

    expect(res.status).toBe(200);
    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updatedOrder?.status).toBe('PAID');
    expect(updatedOrder?.transactionId).toBe('stripe-tx-999');
  });
});
