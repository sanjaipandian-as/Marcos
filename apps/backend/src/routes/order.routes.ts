import { Router } from 'express';
import { OrderController, orderStatusUpdateSchema, orderCheckoutSchema } from '../controllers/order.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Customer endpoints
router.get('/', OrderController.getOrders);
router.post('/checkout', validate(orderCheckoutSchema), OrderController.checkout);

// Admin / Staff endpoints — MUST be before /:id to prevent wildcard conflict
router.get('/admin/list', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), OrderController.adminListOrders);
router.put('/admin/:id/status', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), validate(orderStatusUpdateSchema), OrderController.adminUpdateOrderStatus);
router.put('/admin/:id/quick-status', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), OrderController.adminUpdateQuickOrderStatus);
router.get('/admin/:id/packing-slip', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), OrderController.adminGetPackingSlip);

// Dynamic /:id routes — MUST be after all static paths
router.get('/:id', OrderController.getOrderById);
router.post('/:id/cancel', OrderController.cancelOrder);

export default router;
