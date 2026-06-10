"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_js_1 = require("../controllers/notification.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticate);
router.put('/recipients/read-all', notification_controller_js_1.NotificationController.markAllAsRead);
router.put('/recipients/:id/read', notification_controller_js_1.NotificationController.markAsRead);
router.get('/history', notification_controller_js_1.NotificationController.getHistory);
// Admin-Only Notification endpoints
router.post('/admin/broadcast', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), (0, validate_middleware_js_1.validate)(notification_controller_js_1.broadcastNotificationSchema), notification_controller_js_1.NotificationController.broadcastNotification);
router.post('/admin/send', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), (0, validate_middleware_js_1.validate)(notification_controller_js_1.targetedNotificationSchema), notification_controller_js_1.NotificationController.sendTargetedNotification);
exports.default = router;
