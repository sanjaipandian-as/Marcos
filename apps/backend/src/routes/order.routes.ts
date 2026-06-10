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
router.get('/:id', OrderController.getOrderById);

// Admin / Staff endpoints
router.get('/admin/list', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), OrderController.adminListOrders);
router.put('/admin/:id/status', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), validate(orderStatusUpdateSchema), OrderController.adminUpdateOrderStatus);
router.get('/admin/:id/packing-slip', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), OrderController.adminGetPackingSlip);

export default router;
