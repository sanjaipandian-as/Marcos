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

// Enforce authenticate globally for all /admin routes
router.use(authenticate);

// Read-only / utility routes allowed for STAFF as well
router.get('/customers', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), AdminCustomerController.listCustomers);
router.get('/customers-intelligence', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), AdminCustomerController.getCustomerIntelligence);
router.get('/customers/:id', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), AdminCustomerController.getCustomerDetails);
router.get('/orders-intelligence', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), AdminController.getOrderIntelligence);
router.get('/revenue-intelligence', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), AdminController.getRevenueIntelligence);
router.get('/promotions-intelligence', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), AdminController.getPromotionsIntelligence);
router.get('/inventory-intelligence', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), AdminController.getInventoryIntelligence);
router.post('/upload', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), upload.single('image'), validateUpload(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 5 * 1024 * 1024), AdminController.uploadImage);

// Helper for other routes restricted to ADMIN & SUPERADMIN
const restrictToAdmin = authorize(Role.ADMIN, Role.SUPERADMIN);

router.get('/dashboard', restrictToAdmin, AdminController.getDashboard);
router.post('/loyalty/adjust', restrictToAdmin, validate(loyaltyAdjustSchema), AdminController.adjustPoints);
router.get('/loyalty/transactions', restrictToAdmin, AdminController.listPointTransactions);
router.get('/reports', restrictToAdmin, AdminController.getExtendedReports);

// Platform Settings & Audits
router.get('/settings', restrictToAdmin, AdminController.getSystemSettings);
router.put('/settings', restrictToAdmin, validate(systemSettingsUpdateSchema), AdminController.saveSystemSettings);
router.get('/audits', restrictToAdmin, AdminController.getAuditLogs);

// Product Management CRUD
router.post('/products', restrictToAdmin, validate(productCreateSchema), AdminProductController.createProduct);
router.put('/products/:id', restrictToAdmin, validate(productUpdateSchema), AdminProductController.updateProduct);
router.delete('/products/:id', restrictToAdmin, AdminProductController.deleteProduct);
router.put('/products/:id/trending', restrictToAdmin, validate(trendingToggleSchema), AdminProductController.toggleTrending);

// Category Management CRUD & Ordering
router.post('/categories', restrictToAdmin, validate(categoryCreateSchema), AdminCategoryController.createCategory);
router.put('/categories/reorder', restrictToAdmin, validate(categoriesReorderSchema), AdminCategoryController.reorderCategories);
router.put('/categories/:id', restrictToAdmin, validate(categoryUpdateSchema), AdminCategoryController.updateCategory);
router.delete('/categories/:id', restrictToAdmin, AdminCategoryController.deleteCategory);

// Customer deletion (restricted to Admin/SuperAdmin)
router.delete('/customers/:id', restrictToAdmin, AdminCustomerController.deleteCustomer);

// Staff management (Read-only staff list allowed for STAFF; CRUD restricted to ADMIN/SUPERADMIN)
router.get('/users', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), AdminController.listStaff);
router.post('/users', restrictToAdmin, validate(staffCreateSchema), AdminController.createStaff);
router.put('/users/:id', restrictToAdmin, validate(userUpdateSchema), AdminController.updateStaff);

// Role management (Restricted to SUPERADMIN)
router.put('/users/:id/role', authorize(Role.SUPERADMIN), validate(userRoleUpdateSchema), AdminController.updateUserRole);

// Coupon management
router.get('/coupons', restrictToAdmin, AdminController.listCoupons);
router.post('/coupons', restrictToAdmin, validate(couponCreateSchema), AdminController.createCoupon);
router.put('/coupons/:id/deactivate', restrictToAdmin, AdminController.deactivateCoupon);

export default router;
