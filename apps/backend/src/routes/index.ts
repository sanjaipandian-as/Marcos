import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import measurementRoutes from './measurement.routes.js';
import appointmentRoutes from './appointment.routes.js';
import visitRoutes from './visit.routes.js';
import billingRoutes from './billing.routes.js';
import adminRoutes from './admin.routes.js';
import notificationRoutes from './notification.routes.js';
import bannerRoutes from './banner.routes.js';
import ticketRoutes from './ticket.routes.js';
import orderRoutes from './order.routes.js';
import categoryRoutes from './category.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes); // Maps both `/products` and `/cart` since they are combined
router.use('/measurements', measurementRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/visits', visitRoutes);
router.use('/billing', billingRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/banners', bannerRoutes);
router.use('/tickets', ticketRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);

export default router;

