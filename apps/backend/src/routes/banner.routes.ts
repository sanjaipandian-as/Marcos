import { Router } from 'express';
import { BannerController, bannerCreateSchema, bannerUpdateSchema } from '../controllers/banner.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Public endpoints
router.get('/', BannerController.getBanners);
router.post('/:id/click', BannerController.incrementClicks);

// Admin CRUD endpoints
router.get('/admin', authenticate, authorize(Role.ADMIN, Role.SUPERADMIN), BannerController.adminListBanners);
router.post('/admin', authenticate, authorize(Role.ADMIN, Role.SUPERADMIN), validate(bannerCreateSchema), BannerController.createBanner);
router.put('/admin/:id', authenticate, authorize(Role.ADMIN, Role.SUPERADMIN), validate(bannerUpdateSchema), BannerController.updateBanner);
router.delete('/admin/:id', authenticate, authorize(Role.ADMIN, Role.SUPERADMIN), BannerController.deleteBanner);

export default router;
