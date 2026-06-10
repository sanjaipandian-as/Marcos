import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import JobsProducer from '../queues/jobs.producer.js';

export const broadcastNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    channels: z.array(z.enum(['EMAIL', 'SMS', 'PUSH'])).min(1),
  }),
});

export const targetedNotificationSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().uuid()).min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    channels: z.array(z.enum(['EMAIL', 'SMS', 'PUSH'])).min(1),
  }),
});

export class NotificationController {
  /**
   * PUT /notifications/recipients/:id/read
   * Mark a specific notification as read.
   */
  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    const user = req.user!;
    const { id } = req.params;

    try {
      const recipientRecord = await prisma.notificationRecipient.findUnique({
        where: { id },
      });

      if (!recipientRecord) {
        return res.status(404).json({ success: false, message: 'Notification recipient record not found' });
      }

      if (recipientRecord.userId !== user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not own this notification' });
      }

      const updated = await prisma.notificationRecipient.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /notifications/recipients/read-all
   * Marks all unread notification recipient records for the logged-in user as read in a single transaction.
   */
  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    const user = req.user!;

    try {
      const result = await prisma.notificationRecipient.updateMany({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /notifications/history
   * Retrieve active history of received push notifications.
   */
  static async getHistory(req: Request, res: Response, next: NextFunction) {
    const user = req.user!;

    try {
      const history = await prisma.notificationRecipient.findMany({
        where: { userId: user.id },
        include: { notification: true },
        orderBy: { notification: { createdAt: 'desc' } },
      });

      return res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /notifications/admin/broadcast (Admin Only)
   * Broadcasts a notification blast to all registered customers.
   */
  static async broadcastNotification(req: Request, res: Response, next: NextFunction) {
    const { title, body, channels } = req.body;

    try {
      const notification = await prisma.notification.create({
        data: {
          title,
          body,
          type: 'PROMOTIONAL_BLAST',
        },
      });

      // Get all customer IDs
      const customers = await prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: { id: true },
      });

      if (customers.length > 0) {
        await prisma.notificationRecipient.createMany({
          data: customers.map((c) => ({
            notificationId: notification.id,
            userId: c.id,
          })),
        });

        // Queue workers for sending actual notifications
        for (const customer of customers) {
          await JobsProducer.queueNotification({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /notifications/admin/send (Admin Only)
   * Sends targeted notification alert to specific users.
   */
  static async sendTargetedNotification(req: Request, res: Response, next: NextFunction) {
    const { userIds, title, body, channels } = req.body;

    try {
      const notification = await prisma.notification.create({
        data: {
          title,
          body,
          type: 'ORDER_UPDATE',
        },
      });

      await prisma.notificationRecipient.createMany({
        data: userIds.map((uid: string) => ({
          notificationId: notification.id,
          userId: uid,
        })),
      });

      for (const uid of userIds) {
        await JobsProducer.queueNotification({
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
    } catch (error) {
      next(error);
    }
  }
}
