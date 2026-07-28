"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsQueue = exports.JobsProducer = void 0;
const bullmq_1 = require("bullmq");
const queue_config_js_1 = require("./queue.config.js");
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const environment_js_1 = require("../config/environment.js");
let jobsQueue = null;
exports.jobsQueue = jobsQueue;
if (!environment_js_1.isDevelopment) {
    try {
        exports.jobsQueue = jobsQueue = new bullmq_1.Queue(queue_config_js_1.QUEUE_NAME, {
            connection: queue_config_js_1.connectionOptions,
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
            logger_js_1.default.error('BullMQ Queue Error:', { metadata: { error: err.message } });
        });
    }
    catch (err) {
        logger_js_1.default.error('Failed to initialize BullMQ Queue client', { metadata: { error: err.message } });
    }
}
else {
    logger_js_1.default.info('BullMQ Queue disabled in development to save Redis limits.');
}
class JobsProducer {
    /**
     * Queue PDF Generation job
     */
    static async queueInvoicePdf(orderId) {
        if (!jobsQueue) {
            logger_js_1.default.info(`[DEV MODE] Generating PDF invoice synchronously for order ${orderId}`);
            const { handleGenerateInvoicePdf } = await import('./jobs.worker.js');
            handleGenerateInvoicePdf(orderId).catch(err => logger_js_1.default.error('Failed sync PDF generation:', err));
            return;
        }
        logger_js_1.default.info(`Queueing PDF generation for order ${orderId}`);
        await jobsQueue.add('GENERATE_INVOICE_PDF', { orderId });
    }
    /**
     * Queue external notifications (Email, SMS, FCM push)
     */
    static async queueNotification(payload) {
        if (!jobsQueue) {
            logger_js_1.default.info(`[DEV MODE] Sending notification synchronously for user ${payload.userId}`);
            const { handleSendNotification } = await import('./jobs.worker.js');
            handleSendNotification(payload).catch(err => logger_js_1.default.error('Failed sync notification dispatch:', err));
            return;
        }
        logger_js_1.default.info(`Queueing notifications for user ${payload.userId}`);
        await jobsQueue.add('SEND_NOTIFICATION', payload);
    }
    /**
     * Queue loyalty points calculation and referral award
     */
    static async queueCreditReferralPoints(orderId, userId) {
        if (!jobsQueue) {
            logger_js_1.default.info(`[DEV MODE] Crediting points synchronously for order ${orderId}`);
            const { handleCreditReferralPoints } = await import('./jobs.worker.js');
            handleCreditReferralPoints(orderId, userId).catch(err => logger_js_1.default.error('Failed sync points credit:', err));
            return;
        }
        logger_js_1.default.info(`Queueing referral/loyalty point credit for order ${orderId}, user ${userId}`);
        await jobsQueue.add('CREDIT_REFERRAL_POINTS', { orderId, userId });
    }
}
exports.JobsProducer = JobsProducer;
exports.default = JobsProducer;
