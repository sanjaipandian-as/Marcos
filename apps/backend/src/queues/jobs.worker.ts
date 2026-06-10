import { Worker, Job } from 'bullmq';
import { connectionOptions, QUEUE_NAME } from './queue.config.js';
import prisma from '../config/db.js';
import logger from '../utils/logger.js';
import PdfService from '../services/pdf.service.js';
import R2Service from '../services/r2.service.js';
import EmailService from '../services/email.service.js';
import SmsService from '../services/sms.service.js';
import NotificationService from '../services/notification.service.js';
import JobsProducer from './jobs.producer.js';
import { getIO } from '../socket/socket.handler.js';

let worker: Worker;

export function initWorker() {
  worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      logger.info(`Starting job: ${job.name} (ID: ${job.id})`);

      switch (job.name) {
        case 'GENERATE_INVOICE_PDF':
          await handleGenerateInvoicePdf(job.data.orderId);
          break;
        case 'SEND_NOTIFICATION':
          await handleSendNotification(job.data);
          break;
        case 'CREDIT_REFERRAL_POINTS':
          await handleCreditReferralPoints(job.data.orderId, job.data.userId);
          break;
        default:
          logger.warn(`Unknown job name: ${job.name}`);
      }
    },
    {
      connection: connectionOptions,
      concurrency: 5,
    }
  );

  worker.on('error', (err) => {
    logger.error('BullMQ Worker Error:', { metadata: { error: err.message } });
  });

  // Failure listener for DLQ handling
  worker.on('failed', async (job, err) => {
    if (!job) return;
    
    logger.error(`JOB_FAILURE: Job ${job.name} (ID: ${job.id}) failed after ${job.attemptsMade} retries`, {
      metadata: { error: err.message, stack: err.stack, data: job.data },
    });

    try {
      // 1. Write to database AuditLog
      await prisma.auditLog.create({
        data: {
          action: 'JOB_FAILURE',
          details: {
            message: `Background job ${job.name} (ID: ${job.id}) failed permanently.`,
            error: err.message,
            stack: err.stack,
            jobData: job.data,
            attemptsMade: job.attemptsMade,
          },
        },
      });

      // 2. Broadcast socket audit:alert to superadmins
      const io = getIO();
      if (io) {
        io.to('superadmins').emit('audit:alert', {
          action: 'JOB_FAILURE',
          jobName: job.name,
          jobId: job.id,
          message: `Job ${job.name} failed: ${err.message}`,
        });
      }

      // 3. Update Order / Invoice status to failed if applicable
      if (job.name === 'GENERATE_INVOICE_PDF' && job.data.orderId) {
        await prisma.order.update({
          where: { id: job.data.orderId },
          data: { status: 'CANCELLED' }, // Or set to a failed billing status
        });
      }
    } catch (e: any) {
      logger.error('Failed to execute job failure cleanup rules', { metadata: { error: e.message } });
    }
  });

  logger.info('BullMQ Background Worker Initialized.');
}

/**
 * PDF generator background handler
 */
export async function handleGenerateInvoicePdf(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: { product: true },
      },
      user: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Construct customer mock/real info
  const customer = order.user || {
    id: '',
    fullName: 'Offline Guest Customer',
    email: 'guest@marcosapp.com',
    phoneNumber: 'N/A',
  };

  // Compile PDF via PDFKit service
  const pdfBuffer = await PdfService.generateInvoicePdf(order, customer);

  // Upload to object store (Cloudflare R2 or local fallback)
  const fileKey = `invoices/${order.invoiceNumber}-${Date.now()}.pdf`;
  const pdfUrl = await R2Service.uploadFile(pdfBuffer, fileKey, 'application/pdf');

  // Save/Update Invoice model
  const invoice = await prisma.invoice.upsert({
    where: { orderId: order.id },
    update: { pdfUrl },
    create: {
      orderId: order.id,
      pdfUrl,
    },
  });

  // Log INVOICE_GENERATED
  await prisma.auditLog.create({
    data: {
      userId: order.userId || null,
      action: 'INVOICE_GENERATED',
      details: {
        message: `PDF Invoice generated and uploaded to R2 for Order ${order.invoiceNumber}. PDF URL: ${pdfUrl}`,
        orderId: order.id,
        invoiceId: invoice.id,
        pdfUrl,
      },
    },
  }).catch((err: any) => logger.error('Failed to log invoice generation audit:', err));

  // Trigger notification send job downstream
  if (customer.email && customer.email !== 'guest@marcosapp.com') {
    await JobsProducer.queueNotification({
      userId: customer.id || '',
      channels: ['EMAIL'],
      templates: {
        email: {
          id: 'invoice-template',
          data: {
            customerName: customer.fullName,
            invoiceNumber: order.invoiceNumber,
            payableAmount: order.payableAmount,
            invoiceUrl: pdfUrl,
          },
        },
      },
    });
  }
}

/**
 * Notification dispatcher background handler
 */
export async function handleSendNotification(data: any) {
  const { userId, channels, templates } = data;
  
  let user: any = null;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  }

  const recipientEmail = user?.email || 'customer@example.com';
  const recipientPhone = user?.phoneNumber || '+1234567890';

  for (const channel of channels) {
    if (channel === 'EMAIL' && templates.email) {
      await EmailService.sendEmail(
        recipientEmail,
        `Your Invoice ${templates.email.data?.invoiceNumber || ''}`,
        `Hello ${templates.email.data?.customerName || 'Customer'}, here is your invoice.`,
        undefined,
        templates.email.id,
        templates.email.data
      );
    }
    
    if (channel === 'SMS' && templates.sms) {
      await SmsService.sendSms(recipientPhone, templates.sms);
    }
    
    if (channel === 'PUSH' && templates.push && userId) {
      // 1. Persist notification in database first
      const notification = await prisma.notification.create({
        data: {
          title: templates.push.title,
          body: templates.push.body,
          type: 'ORDER_UPDATE',
        },
      });

      await prisma.notificationRecipient.create({
        data: {
          notificationId: notification.id,
          userId,
        },
      });

      // 2. Dispatch Push notification
      await NotificationService.sendPushNotification(
        userId,
        templates.push.title,
        templates.push.body
      );

      // 3. Emit real-time visit or order notification to the specific room
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('notification:received', {
          id: notification.id,
          title: templates.push.title,
          body: templates.push.body,
        });
      }
    }
  }
}

/**
 * Referral points calculation background handler
 */
export async function handleCreditReferralPoints(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Calculate points: 1 point per $10 spent
  const spentAmount = Number(order.payableAmount);
  const earnedPoints = Math.floor(spentAmount / 10);

  // We run everything in a transaction to prevent concurrency bugs
  await prisma.$transaction(async (tx: any) => {
    // 1. Credit loyalty points for the purchase
    if (earnedPoints > 0) {
      await tx.user.update({
        where: { id: userId },
        data: {
          pointsBalance: { increment: earnedPoints },
        },
      });

      await tx.pointTransaction.create({
        data: {
          userId,
          points: earnedPoints,
          reason: `Purchase points for Order ${order.invoiceNumber}`,
        },
      });

      // Log POINTS_CREDITED
      await tx.auditLog.create({
        data: {
          userId: null,
          action: 'POINTS_CREDITED',
          details: {
            message: `Automatically credited ${earnedPoints} points to customer ID ${userId} for Order ${order.invoiceNumber}`,
            userId,
            points: earnedPoints,
            orderId: order.id,
            reason: 'purchase',
          },
        },
      });
    }

    // 2. Referral points: check if it's the customer's first completed/paid order
    const completedOrdersCount = await tx.order.count({
      where: {
        userId,
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      },
    });

    // If this is their first order, check if they were referred by someone
    if (completedOrdersCount <= 1) {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (user && user.referredById) {
        const referralBonus = 100; // 100 bonus points each

        // Credit referrer
        await tx.user.update({
          where: { id: user.referredById },
          data: {
            pointsBalance: { increment: referralBonus },
          },
        });

        await tx.pointTransaction.create({
          data: {
            userId: user.referredById,
            points: referralBonus,
            reason: `Referral bonus for referring user ${user.fullName}`,
          },
        });

        // Log REFERRAL_POINTS_AWARDED for referrer
        await tx.auditLog.create({
          data: {
            userId: null,
            action: 'REFERRAL_POINTS_AWARDED',
            details: {
              message: `Awarded ${referralBonus} referral points to referrer ID ${user.referredById} for user ID ${userId}'s first order`,
              userId: user.referredById,
              points: referralBonus,
              refereeUserId: userId,
              orderId,
            },
          },
        });

        // Credit referee
        await tx.user.update({
          where: { id: userId },
          data: {
            pointsBalance: { increment: referralBonus },
          },
        });

        await tx.pointTransaction.create({
          data: {
            userId,
            points: referralBonus,
            reason: `Referral sign-up bonus (referred by other user)`,
          },
        });

        // Log REFERRAL_POINTS_AWARDED for referee
        await tx.auditLog.create({
          data: {
            userId: null,
            action: 'REFERRAL_POINTS_AWARDED',
            details: {
              message: `Awarded ${referralBonus} referral points to referee ID ${userId} on their first order`,
              userId,
              points: referralBonus,
              referrerUserId: user.referredById,
              orderId,
            },
          },
        });

        logger.info(`Referred bonus of ${referralBonus} points credited to referrer ${user.referredById} and referee ${userId}`);
      }
    }
  });
}
