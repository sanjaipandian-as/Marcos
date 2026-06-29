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
import { AdminCategoryController, categoryCreateSchema, categoryUpdateSchema, categoriesReorderSchema, subCategoryCreateSchema, subCategoryUpdateSchema } from '../controllers/adminCategory.controller.js';
import { AdminCustomerController, appCustomerCreateSchema, appCustomerUpdateSchema } from '../controllers/adminCustomer.controller.js';
import { OfferController, offerCreateSchema, offerUpdateSchema } from '../controllers/offer.controller.js';
import { StoreLocationController, storeLocationCreateSchema, storeLocationUpdateSchema } from '../controllers/storeLocation.controller.js';
import { PromoContentController, promoCreateSchema, promoUpdateSchema } from '../controllers/promoContent.controller.js';
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
router.post('/upload-video', authorize(Role.ADMIN, Role.SUPERADMIN), upload.single('video'), AdminController.uploadImage);

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

// Sub-Category Management CRUD
router.post('/categories/:categoryId/subcategories', restrictToAdmin, validate(subCategoryCreateSchema), AdminCategoryController.createSubCategory);
router.put('/subcategories/:id', restrictToAdmin, validate(subCategoryUpdateSchema), AdminCategoryController.updateSubCategory);
router.delete('/subcategories/:id', restrictToAdmin, AdminCategoryController.deleteSubCategory);

// App Customer Management (Admin-created customers for the mobile app)
router.post('/customers', restrictToAdmin, validate(appCustomerCreateSchema), AdminCustomerController.createCustomer);
router.put('/customers/:id', restrictToAdmin, validate(appCustomerUpdateSchema), AdminCustomerController.updateCustomer);
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

// Offer management
router.get('/offers', restrictToAdmin, OfferController.listOffers);
router.post('/offers', restrictToAdmin, validate(offerCreateSchema), OfferController.createOffer);
router.put('/offers/:id', restrictToAdmin, validate(offerUpdateSchema), OfferController.updateOffer);
router.delete('/offers/:id', restrictToAdmin, OfferController.deleteOffer);

// Store Location management
router.get('/stores', restrictToAdmin, StoreLocationController.listStores);
router.post('/stores', restrictToAdmin, validate(storeLocationCreateSchema), StoreLocationController.createStore);
router.put('/stores/:id', restrictToAdmin, validate(storeLocationUpdateSchema), StoreLocationController.updateStore);
router.delete('/stores/:id', restrictToAdmin, StoreLocationController.deleteStore);

// Promo Content management
router.get('/promos', restrictToAdmin, PromoContentController.listPromos);
router.post('/promos', restrictToAdmin, validate(promoCreateSchema), PromoContentController.createPromo);
router.put('/promos/:id', restrictToAdmin, validate(promoUpdateSchema), PromoContentController.updatePromo);
router.delete('/promos/:id', restrictToAdmin, PromoContentController.deletePromo);

export default router;
