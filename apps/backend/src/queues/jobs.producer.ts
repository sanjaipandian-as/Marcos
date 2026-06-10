import { Queue } from 'bullmq';
import { connectionOptions, QUEUE_NAME } from './queue.config.js';
import logger from '../utils/logger.js';

let jobsQueue: Queue;

try {
  jobsQueue = new Queue(QUEUE_NAME, {
    connection: connectionOptions,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000, // starting backoff delay 2 seconds
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  jobsQueue.on('error', (err) => {
    logger.error('BullMQ Queue Error:', { metadata: { error: err.message } });
  });
} catch (err: any) {
  logger.error('Failed to initialize BullMQ Queue client', { metadata: { error: err.message } });
}

export class JobsProducer {
  /**
   * Queue PDF Generation job
   */
  static async queueInvoicePdf(orderId: string) {
    if (!jobsQueue) return;
    logger.info(`Queueing PDF generation for order ${orderId}`);
    await jobsQueue.add('GENERATE_INVOICE_PDF', { orderId });
  }

  /**
   * Queue external notifications (Email, SMS, FCM push)
   */
  static async queueNotification(payload: {
    userId: string;
    channels: ('EMAIL' | 'SMS' | 'PUSH')[];
    templates: {
      email?: { id: string; data: any };
      sms?: string;
      push?: { title: string; body: string };
    };
  }) {
    if (!jobsQueue) return;
    logger.info(`Queueing notifications for user ${payload.userId}`);
    await jobsQueue.add('SEND_NOTIFICATION', payload);
  }

  /**
   * Queue loyalty points calculation and referral award
   */
  static async queueCreditReferralPoints(orderId: string, userId: string) {
    if (!jobsQueue) return;
    logger.info(`Queueing referral/loyalty point credit for order ${orderId}, user ${userId}`);
    await jobsQueue.add('CREDIT_REFERRAL_POINTS', { orderId, userId });
  }
}

export { jobsQueue };
export default JobsProducer;
