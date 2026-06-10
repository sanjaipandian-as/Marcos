import { Router } from 'express';
import { 
  AdminController, 
  loyaltyAdjustSchema, 
  userRoleUpdateSchema, 
  couponCreateSchema,
  staffCreateSchema,
  userUpdateSchema,
  systemSettingsUpdateSchema
} from '../controllers/admin.controller.js';
import { AdminProductController, productCreateSchema, productUpdateSchema, trendingToggleSchema } from '../controllers/adminProduct.controller.js';
import { AdminCategoryController, categoryCreateSchema, categoryUpdateSchema, categoriesReorderSchema } from '../controllers/adminCategory.controller.js';
import { AdminCustomerController } from '../controllers/adminCustomer.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { upload, validateUpload } from '../middlewares/upload.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Enforce Admin/SuperAdmin for all /admin routes
router.use(authenticate, authorize(Role.ADMIN, Role.SUPERADMIN));

router.get('/dashboard', AdminController.getDashboard);
router.post('/loyalty/adjust', validate(loyaltyAdjustSchema), AdminController.adjustPoints);
router.get('/loyalty/transactions', AdminController.listPointTransactions);
router.get('/reports', AdminController.getExtendedReports);

// Platform Settings & Audits
router.get('/settings', AdminController.getSystemSettings);
router.put('/settings', validate(systemSettingsUpdateSchema), AdminController.saveSystemSettings);
router.get('/audits', AdminController.getAuditLogs);

// Product Management CRUD
router.post('/products', validate(productCreateSchema), AdminProductController.createProduct);
router.put('/products/:id', validate(productUpdateSchema), AdminProductController.updateProduct);
router.delete('/products/:id', AdminProductController.deleteProduct);
router.put('/products/:id/trending', validate(trendingToggleSchema), AdminProductController.toggleTrending);

// Category Management CRUD & Ordering
router.post('/categories', validate(categoryCreateSchema), AdminCategoryController.createCategory);
router.put('/categories/reorder', validate(categoriesReorderSchema), AdminCategoryController.reorderCategories);
router.put('/categories/:id', validate(categoryUpdateSchema), AdminCategoryController.updateCategory);
router.delete('/categories/:id', AdminCategoryController.deleteCategory);

// Customer Management Panel
router.get('/customers', AdminCustomerController.listCustomers);
router.get('/customers/:id', AdminCustomerController.getCustomerDetails);
router.delete('/customers/:id', AdminCustomerController.deleteCustomer);

// Staff management (Create staff & update name/role)
router.get('/users', AdminController.listStaff);
router.post('/users', validate(staffCreateSchema), AdminController.createStaff);
router.put('/users/:id', validate(userUpdateSchema), AdminController.updateStaff);
router.post('/upload', upload.single('image'), validateUpload(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 5 * 1024 * 1024), AdminController.uploadImage);

// Role management (Restricted to SUPERADMIN)
router.put('/users/:id/role', authorize(Role.SUPERADMIN), validate(userRoleUpdateSchema), AdminController.updateUserRole);

// Coupon management
router.get('/coupons', AdminController.listCoupons);
router.post('/coupons', validate(couponCreateSchema), AdminController.createCoupon);
router.put('/coupons/:id/deactivate', AdminController.deactivateCoupon);

export default router;
