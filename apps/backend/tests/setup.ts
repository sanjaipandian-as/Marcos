import { jest } from '@jest/globals';
import prisma from '../src/config/db.js';
import redis from '../src/config/redis.js';

// Mock bullmq to prevent queue initialization and connection attempts
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockImplementation(() => Promise.resolve()),
      on: jest.fn(),
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
    })),
  };
});

// Mock JobsProducer
jest.mock('../src/queues/jobs.producer.js', () => {
  const mockQueueInvoicePdf = jest.fn().mockImplementation(() => Promise.resolve());
  const mockQueueNotification = jest.fn().mockImplementation(() => Promise.resolve());
  const mockQueueCreditReferralPoints = jest.fn().mockImplementation(() => Promise.resolve());
  return {
    __esModule: true,
    JobsProducer: {
      queueInvoicePdf: mockQueueInvoicePdf,
      queueNotification: mockQueueNotification,
      queueCreditReferralPoints: mockQueueCreditReferralPoints,
    },
    default: {
      queueInvoicePdf: mockQueueInvoicePdf,
      queueNotification: mockQueueNotification,
      queueCreditReferralPoints: mockQueueCreditReferralPoints,
    },
    jobsQueue: {
      add: jest.fn().mockImplementation(() => Promise.resolve()),
      on: jest.fn(),
    },
  };
});

// Global mock of external integrations to prevent network activity in tests
jest.mock('../src/services/email.service.js', () => {
  const mockEmail = {
    sendEmail: jest.fn().mockImplementation(() => Promise.resolve({ success: true, mock: true })),
  };
  return {
    __esModule: true,
    EmailService: mockEmail,
    default: mockEmail,
  };
});

jest.mock('../src/services/sms.service.js', () => {
  const mockSms = {
    sendSms: jest.fn().mockImplementation(() => Promise.resolve({ success: true, mock: true })),
  };
  return {
    __esModule: true,
    SmsService: mockSms,
    default: mockSms,
  };
});

jest.mock('../src/services/notification.service.js', () => {
  const mockNotification = {
    sendPushNotification: jest.fn().mockImplementation(() => Promise.resolve({ success: true })),
  };
  return {
    __esModule: true,
    NotificationService: mockNotification,
    default: mockNotification,
  };
});

jest.mock('../src/services/r2.service.js', () => {
  const mockR2 = {
    uploadFile: jest.fn().mockImplementation(() => Promise.resolve('https://mock-r2-endpoint/test.pdf')),
    deleteFile: jest.fn().mockImplementation(() => Promise.resolve()),
  };
  return {
    __esModule: true,
    R2Service: mockR2,
    default: mockR2,
  };
});

// Clean up DB & Redis records before each test case run
beforeEach(async () => {
  // Flush redis store
  await redis.flushall();

  // Clear tables sequentially to avoid relation constraint violations
  try {
    await prisma.user.updateMany({ data: { referredById: null } });
  } catch (e) {}

  const tables = [
    'AuditLog',
    'SupportTicket',
    'VisitReport',
    'StoreVisit',
    'Appointment',
    'OrderItem',
    'Invoice',
    'Order',
    'CartItem',
    'UserCoupon',
    'Coupon',
    'PointTransaction',
    'MeasurementHistory',
    'MeasurementProfile',
    'NotificationRecipient',
    'Notification',
    'Banner',
    'Product',
    'Category',
    'User',
  ];

  for (const table of tables) {
    try {
      await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany({});
    } catch (err) {
      // Ignore tables that might not exist or be named differently
    }
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});
