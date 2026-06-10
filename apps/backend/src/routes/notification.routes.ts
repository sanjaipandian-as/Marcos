import { Router } from 'express';
import { NotificationController, broadcastNotificationSchema, targetedNotificationSchema } from '../controllers/notification.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.put('/recipients/read-all', NotificationController.markAllAsRead);
router.put('/recipients/:id/read', NotificationController.markAsRead);
router.get('/history', NotificationController.getHistory);

// Admin-Only Notification endpoints
router.post('/admin/broadcast', authorize(Role.ADMIN, Role.SUPERADMIN), validate(broadcastNotificationSchema), NotificationController.broadcastNotification);
router.post('/admin/send', authorize(Role.ADMIN, Role.SUPERADMIN), validate(targetedNotificationSchema), NotificationController.sendTargetedNotification);

export default router;
