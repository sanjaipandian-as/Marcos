import { jest } from '@jest/globals';
import prisma from '../src/config/db.js';
import { 
  handleCreditReferralPoints, 
  handleGenerateInvoicePdf, 
  handleSendNotification,
  initWorker 
} from '../src/queues/jobs.worker.js';
import { SmsService } from '../src/services/sms.service.js';
import { EmailService } from '../src/services/email.service.js';
import { NotificationService } from '../src/services/notification.service.js';
import { R2Service } from '../src/services/r2.service.js';
import JobsProducer from '../src/queues/jobs.producer.js';
import { initSocket } from '../src/socket/socket.handler.js';
import http from 'http';
import { Worker } from 'bullmq';

// Cast mocks
const mockSendEmail = EmailService.sendEmail as any;
const mockSendSms = SmsService.sendSms as any;
const mockSendPush = NotificationService.sendPushNotification as any;
const mockUploadFile = R2Service.uploadFile as any;
const mockQueueNotification = JobsProducer.queueNotification as any;

describe('Background Worker & Points Credit Engine', () => {
  let referrer: any;
  let referee: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // 1. Create a referrer user
    referrer = await prisma.user.create({
      data: {
        email: 'referrer@marcosapp.com',
        phoneNumber: '+1111111111',
        passwordHash: 'hash',
        fullName: 'Referrer User',
        referralCode: 'REF-REFERRER',
        pointsBalance: 0,
      },
    });

    // 2. Create a referee user signed up using referrer's ID
    referee = await prisma.user.create({
      data: {
        email: 'referee@marcosapp.com',
        phoneNumber: '+2222222222',
        passwordHash: 'hash',
        fullName: 'Referee User',
        referralCode: 'REF-REFEREE',
        referredById: referrer.id,
        pointsBalance: 0,
      },
    });
  });

  test('Points calculations and Referral Credits on first order', async () => {
    // Spend $150 should yield 15 points (1 point per $10)
    // Since first order, both get 100 points referral bonus
    const order = await prisma.order.create({
      data: {
        userId: referee.id,
        status: 'PAID',
        paymentStatus: 'COMPLETED',
        totalAmount: 150.00,
        taxAmount: 0.00,
        discountAmount: 0.00,
        payableAmount: 150.00,
        paymentMethod: 'CARD',
        invoiceNumber: 'INV-JOB-TEST-1',
      },
    });

    await handleCreditReferralPoints(order.id, referee.id);

    const updatedReferee = await prisma.user.findUnique({ where: { id: referee.id } });
    expect(updatedReferee?.pointsBalance).toBe(115);

    const updatedReferrer = await prisma.user.findUnique({ where: { id: referrer.id } });
    expect(updatedReferrer?.pointsBalance).toBe(100);

    const refereeTxs = await prisma.pointTransaction.findMany({ where: { userId: referee.id } });
    expect(refereeTxs.length).toBe(2);
  });

  test('Subsequent orders do not trigger referral points bonuses', async () => {
    const order1 = await prisma.order.create({
      data: {
        userId: referee.id,
        status: 'PAID',
        paymentStatus: 'COMPLETED',
        totalAmount: 100.00,
        taxAmount: 0.00,
        discountAmount: 0.00,
        payableAmount: 100.00,
        paymentMethod: 'CARD',
        invoiceNumber: 'INV-JOB-TEST-2',
      },
    });
    await handleCreditReferralPoints(order1.id, referee.id);

    // Reset balances
    await prisma.user.update({ where: { id: referee.id }, data: { pointsBalance: 0 } });
    await prisma.user.update({ where: { id: referrer.id }, data: { pointsBalance: 0 } });

    const order2 = await prisma.order.create({
      data: {
        userId: referee.id,
        status: 'PAID',
        paymentStatus: 'COMPLETED',
        totalAmount: 50.00,
        taxAmount: 0.00,
        discountAmount: 0.00,
        payableAmount: 50.00,
        paymentMethod: 'CARD',
        invoiceNumber: 'INV-JOB-TEST-3',
      },
    });
    await handleCreditReferralPoints(order2.id, referee.id);

    const updatedReferee = await prisma.user.findUnique({ where: { id: referee.id } });
    const updatedReferrer = await prisma.user.findUnique({ where: { id: referrer.id } });

    expect(updatedReferee?.pointsBalance).toBe(5);
    expect(updatedReferrer?.pointsBalance).toBe(0);
  });

  test('handleGenerateInvoicePdf generates PDF, uploads to R2 and updates Invoice database model', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Classic Blazer',
        description: 'Blazer description',
        price: 200.00,
        categoryId: (await prisma.category.create({ data: { name: 'Suits', slug: 'suits' } })).id,
      },
    });

    const order = await prisma.order.create({
      data: {
        userId: referee.id,
        status: 'PAID',
        paymentStatus: 'COMPLETED',
        totalAmount: 200.00,
        taxAmount: 36.00,
        discountAmount: 0.00,
        payableAmount: 236.00,
        paymentMethod: 'CARD',
        invoiceNumber: 'INV-PDF-TEST-1',
        orderItems: {
          create: {
            productId: product.id,
            quantity: 1,
            price: 200.00,
          },
        },
      },
    });

    mockUploadFile.mockResolvedValueOnce('https://r2-test-bucket/invoice-1.pdf');

    await handleGenerateInvoicePdf(order.id);

    // Assert database invoice created
    const invoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });
    expect(invoice).toBeTruthy();
    expect(invoice?.pdfUrl).toBe('https://r2-test-bucket/invoice-1.pdf');

    // Assert notification job queued
    expect(mockQueueNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: referee.id,
        channels: ['EMAIL'],
        templates: expect.objectContaining({
          email: expect.objectContaining({
            id: 'invoice-template',
            data: expect.objectContaining({
              invoiceUrl: 'https://r2-test-bucket/invoice-1.pdf',
            }),
          }),
        }),
      })
    );
  });

  test('handleSendNotification sends across EMAIL, SMS, and PUSH channels', async () => {
    const notifyPayload = {
      userId: referee.id,
      channels: ['EMAIL', 'SMS', 'PUSH'],
      templates: {
        email: {
          id: 'invoice-template',
          data: {
            customerName: referee.fullName,
            invoiceNumber: 'INV-TEST-99',
            payableAmount: 120,
            invoiceUrl: 'http://invoice.pdf',
          },
        },
        sms: 'Your order INV-TEST-99 has been paid.',
        push: {
          title: 'Order Status',
          body: 'Your custom suit is in processing!',
        },
      },
    };

    await handleSendNotification(notifyPayload);

    // Verify Email service called
    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockSendEmail.mock.calls[0][0]).toBe(referee.email);

    // Verify SMS service called
    expect(mockSendSms).toHaveBeenCalled();
    expect(mockSendSms.mock.calls[0][0]).toBe(referee.phoneNumber);

    // Verify FCM push notification called
    expect(mockSendPush).toHaveBeenCalled();

    // Verify notification records created in DB
    const dbNotif = await prisma.notification.findFirst({
      where: { title: 'Order Status' },
    });
    expect(dbNotif).toBeTruthy();

    const recipient = await prisma.notificationRecipient.findFirst({
      where: { userId: referee.id, notificationId: dbNotif?.id },
    });
    expect(recipient).toBeTruthy();
  });

  test('Worker failed listener processes failure DLQ and updates orders', async () => {
    // Initialize server and socket handlers to capture emits
    const server = http.createServer();
    initSocket(server);

    // Clear mocked worker listener captures
    let failedCallback: any;
    const WorkerMock = Worker as any;
    
    // Instantiate initWorker to trigger registration of failed listener
    initWorker();

    // Find the callback from worker mock registrations
    // Worker mock is configured to capture the event handlers
    const workerInstance = WorkerMock.mock.results[0].value;
    const failedCall = workerInstance.on.mock.calls.find((c: any) => c[0] === 'failed');
    expect(failedCall).toBeDefined();
    failedCallback = failedCall[1];

    // Create an order that we will fail
    const order = await prisma.order.create({
      data: {
        userId: referee.id,
        status: 'PAID',
        paymentStatus: 'COMPLETED',
        totalAmount: 100.00,
        taxAmount: 0.00,
        discountAmount: 0.00,
        payableAmount: 100.00,
        paymentMethod: 'CARD',
        invoiceNumber: 'INV-FAIL-TEST',
      },
    });

    // Invoke failed listener manually
    const mockJob = {
      name: 'GENERATE_INVOICE_PDF',
      id: 'job-123',
      attemptsMade: 5,
      data: { orderId: order.id },
    };
    const mockError = new Error('PDF Generation Failed: Timeout');

    await failedCallback(mockJob, mockError);

    // Verify Order is updated to CANCELLED (or failed billing status)
    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updatedOrder?.status).toBe('CANCELLED');

    // Verify AuditLog record written
    const auditLog = await prisma.auditLog.findFirst({ where: { action: 'JOB_FAILURE' } });
    expect(auditLog).toBeTruthy();
    expect((auditLog?.details as any).error).toBe('PDF Generation Failed: Timeout');

    server.close();
  });
});
