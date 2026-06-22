"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWorker = initWorker;
exports.handleGenerateInvoicePdf = handleGenerateInvoicePdf;
exports.handleSendNotification = handleSendNotification;
exports.handleCreditReferralPoints = handleCreditReferralPoints;
const bullmq_1 = require("bullmq");
const queue_config_js_1 = require("./queue.config.js");
const db_js_1 = __importDefault(require("../config/db.js"));
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const pdf_service_js_1 = __importDefault(require("../services/pdf.service.js"));
const r2_service_js_1 = __importDefault(require("../services/r2.service.js"));
const email_service_js_1 = __importDefault(require("../services/email.service.js"));
const sms_service_js_1 = __importDefault(require("../services/sms.service.js"));
const notification_service_js_1 = __importDefault(require("../services/notification.service.js"));
const jobs_producer_js_1 = __importDefault(require("./jobs.producer.js"));
const socket_handler_js_1 = require("../socket/socket.handler.js");
let worker;
function initWorker() {
    worker = new bullmq_1.Worker(queue_config_js_1.QUEUE_NAME, async (job) => {
        logger_js_1.default.info(`Starting job: ${job.name} (ID: ${job.id})`);
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
                logger_js_1.default.warn(`Unknown job name: ${job.name}`);
        }
    }, {
        connection: queue_config_js_1.connectionOptions,
        concurrency: 2,
        drainDelay: 30, // Wait 30 seconds between polls when queue is empty (saves Redis commands)
    });
    worker.on('error', (err) => {
        logger_js_1.default.error('BullMQ Worker Error:', { metadata: { error: err.message } });
    });
    // Failure listener for DLQ handling
    worker.on('failed', async (job, err) => {
        if (!job)
            return;
        logger_js_1.default.error(`JOB_FAILURE: Job ${job.name} (ID: ${job.id}) failed after ${job.attemptsMade} retries`, {
            metadata: { error: err.message, stack: err.stack, data: job.data },
        });
        try {
            // 1. Write to database AuditLog
            await db_js_1.default.auditLog.create({
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
            const io = (0, socket_handler_js_1.getIO)();
            if (io) {
                io.to('superadmins').emit('audit:alert', {
                    action: 'JOB_FAILURE',
                    jobName: job.name,
                    jobId: job.id,
                    message: `Job ${job.name} failed: ${err.message}`,
                });
            }
            // 3. Log invoice generation failure — DO NOT cancel the order
            // The order is already paid/valid; PDF failure is a non-critical side effect
            if (job.name === 'GENERATE_INVOICE_PDF' && job.data.orderId) {
                logger_js_1.default.error(`Invoice PDF generation failed for order ${job.data.orderId}. Order status NOT changed. Admin intervention required.`);
                // Notify superadmins specifically about the invoice failure
                const io2 = (0, socket_handler_js_1.getIO)();
                if (io2) {
                    io2.to('superadmins').emit('audit:alert', {
                        action: 'INVOICE_PDF_FAILED',
                        orderId: job.data.orderId,
                        message: `Invoice PDF generation permanently failed for order ${job.data.orderId}. Manual generation required.`,
                    });
                }
            }
        }
        catch (e) {
            logger_js_1.default.error('Failed to execute job failure cleanup rules', { metadata: { error: e.message } });
        }
    });
    logger_js_1.default.info('BullMQ Background Worker Initialized.');
}
/**
 * PDF generator background handler
 */
async function handleGenerateInvoicePdf(orderId) {
    const order = await db_js_1.default.order.findUnique({
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
    const pdfBuffer = await pdf_service_js_1.default.generateInvoicePdf(order, customer);
    // Upload to object store (Cloudflare R2 or local fallback)
    const fileKey = `invoices/${order.invoiceNumber}-${Date.now()}.pdf`;
    const pdfUrl = await r2_service_js_1.default.uploadFile(pdfBuffer, fileKey, 'application/pdf');
    // Save/Update Invoice model
    const invoice = await db_js_1.default.invoice.upsert({
        where: { orderId: order.id },
        update: { pdfUrl },
        create: {
            orderId: order.id,
            pdfUrl,
        },
    });
    // Log INVOICE_GENERATED
    await db_js_1.default.auditLog.create({
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
    }).catch((err) => logger_js_1.default.error('Failed to log invoice generation audit:', err));
    // Trigger notification send job downstream
    if (customer.email && customer.email !== 'guest@marcosapp.com') {
        await jobs_producer_js_1.default.queueNotification({
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
async function handleSendNotification(data) {
    const { userId, channels, templates } = data;
    let user = null;
    if (userId) {
        user = await db_js_1.default.user.findUnique({ where: { id: userId } });
    }
    const recipientEmail = user?.email || 'customer@example.com';
    const recipientPhone = user?.phoneNumber || '+1234567890';
    for (const channel of channels) {
        if (channel === 'EMAIL' && templates.email) {
            await email_service_js_1.default.sendEmail(recipientEmail, `Your Invoice ${templates.email.data?.invoiceNumber || ''}`, `Hello ${templates.email.data?.customerName || 'Customer'}, here is your invoice.`, undefined, templates.email.id, templates.email.data);
        }
        if (channel === 'SMS' && templates.sms) {
            await sms_service_js_1.default.sendSms(recipientPhone, templates.sms);
        }
        if (channel === 'PUSH' && templates.push && userId) {
            // 1. Persist notification in database first
            const notification = await db_js_1.default.notification.create({
                data: {
                    title: templates.push.title,
                    body: templates.push.body,
                    type: 'ORDER_UPDATE',
                },
            });
            await db_js_1.default.notificationRecipient.create({
                data: {
                    notificationId: notification.id,
                    userId,
                },
            });
            // 2. Dispatch Push notification
            await notification_service_js_1.default.sendPushNotification(userId, templates.push.title, templates.push.body);
            // 3. Emit real-time visit or order notification to the specific room
            const io = (0, socket_handler_js_1.getIO)();
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
async function handleCreditReferralPoints(orderId, userId) {
    const order = await db_js_1.default.order.findUnique({
        where: { id: orderId },
    });
    if (!order) {
        throw new Error(`Order ${orderId} not found`);
    }
    // Calculate points: 1 point per $10 spent
    const spentAmount = Number(order.payableAmount);
    const earnedPoints = Math.floor(spentAmount / 10);
    // We run everything in a transaction to prevent concurrency bugs
    await db_js_1.default.$transaction(async (tx) => {
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
                // Credit referee — Note: referee already received 100 sign-up bonus during registration,
                // so we only credit the referrer here to avoid double-counting.
                // The referee's registration bonus was handled in auth.controller.ts
            }
        }
    });
}
