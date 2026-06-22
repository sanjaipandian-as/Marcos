"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = exports.targetedNotificationSchema = exports.broadcastNotificationSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
const jobs_producer_js_1 = __importDefault(require("../queues/jobs.producer.js"));
exports.broadcastNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1),
        body: zod_1.z.string().min(1),
        channels: zod_1.z.array(zod_1.z.enum(['EMAIL', 'SMS', 'PUSH'])).min(1),
    }),
});
exports.targetedNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
        title: zod_1.z.string().min(1),
        body: zod_1.z.string().min(1),
        channels: zod_1.z.array(zod_1.z.enum(['EMAIL', 'SMS', 'PUSH'])).min(1),
    }),
});
class NotificationController {
    /**
     * PUT /notifications/recipients/:id/read
     * Mark a specific notification as read.
     */
    static async markAsRead(req, res, next) {
        const user = req.user;
        const { id } = req.params;
        try {
            const recipientRecord = await db_js_1.default.notificationRecipient.findUnique({
                where: { id },
            });
            if (!recipientRecord) {
                return res.status(404).json({ success: false, message: 'Notification recipient record not found' });
            }
            if (recipientRecord.userId !== user.id) {
                return res.status(403).json({ success: false, message: 'Forbidden: You do not own this notification' });
            }
            const updated = await db_js_1.default.notificationRecipient.update({
                where: { id },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
            return res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /notifications/recipients/read-all
     * Marks all unread notification recipient records for the logged-in user as read in a single transaction.
     */
    static async markAllAsRead(req, res, next) {
        const user = req.user;
        try {
            const result = await db_js_1.default.notificationRecipient.updateMany({
                where: {
                    userId: user.id,
                    isRead: false,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
            return res.status(200).json({
                success: true,
                updatedCount: result.count,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /notifications/history
     * Retrieve active history of received push notifications.
     */
    static async getHistory(req, res, next) {
        const user = req.user;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        try {
            const [history, total] = await Promise.all([
                db_js_1.default.notificationRecipient.findMany({
                    where: { userId: user.id },
                    include: { notification: true },
                    orderBy: { notification: { createdAt: 'desc' } },
                    skip,
                    take: Number(limit),
                }),
                db_js_1.default.notificationRecipient.count({ where: { userId: user.id } }),
            ]);
            return res.status(200).json({
                success: true,
                data: history,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /notifications/admin/broadcast (Admin Only)
     * Broadcasts a notification blast to all registered customers.
     */
    static async broadcastNotification(req, res, next) {
        const { title, body, channels } = req.body;
        try {
            const notification = await db_js_1.default.notification.create({
                data: {
                    title,
                    body,
                    type: 'PROMOTIONAL_BLAST',
                },
            });
            // Get all customer IDs
            const customers = await db_js_1.default.user.findMany({
                where: { role: 'CUSTOMER' },
                select: { id: true },
            });
            if (customers.length > 0) {
                await db_js_1.default.notificationRecipient.createMany({
                    data: customers.map((c) => ({
                        notificationId: notification.id,
                        userId: c.id,
                    })),
                });
                // Queue workers for sending actual notifications
                for (const customer of customers) {
                    await jobs_producer_js_1.default.queueNotification({
                        userId: customer.id,
                        channels,
                        templates: {
                            email: { id: 'broadcast', data: { title, body } },
                            sms: body,
                            push: { title, body },
                        },
                    });
                }
            }
            return res.status(201).json({
                success: true,
                message: `Broadcast queued successfully for ${customers.length} users.`,
                data: notification,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /notifications/admin/send (Admin Only)
     * Sends targeted notification alert to specific users.
     */
    static async sendTargetedNotification(req, res, next) {
        const { userIds, title, body, channels } = req.body;
        try {
            const notification = await db_js_1.default.notification.create({
                data: {
                    title,
                    body,
                    type: 'ORDER_UPDATE',
                },
            });
            await db_js_1.default.notificationRecipient.createMany({
                data: userIds.map((uid) => ({
                    notificationId: notification.id,
                    userId: uid,
                })),
            });
            for (const uid of userIds) {
                await jobs_producer_js_1.default.queueNotification({
                    userId: uid,
                    channels,
                    templates: {
                        email: { id: 'alert', data: { title, body } },
                        sms: body,
                        push: { title, body },
                    },
                });
            }
            return res.status(201).json({
                success: true,
                message: `Targeted notification queued successfully for ${userIds.length} users.`,
                data: notification,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationController = NotificationController;
