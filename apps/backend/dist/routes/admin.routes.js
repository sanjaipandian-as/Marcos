"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_js_1 = require("../controllers/admin.controller.js");
const adminProduct_controller_js_1 = require("../controllers/adminProduct.controller.js");
const adminCategory_controller_js_1 = require("../controllers/adminCategory.controller.js");
const adminCustomer_controller_js_1 = require("../controllers/adminCustomer.controller.js");
const offer_controller_js_1 = require("../controllers/offer.controller.js");
const storeLocation_controller_js_1 = require("../controllers/storeLocation.controller.js");
const promoContent_controller_js_1 = require("../controllers/promoContent.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const upload_middleware_js_1 = require("../middlewares/upload.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Enforce authenticate globally for all /admin routes
router.use(auth_middleware_js_1.authenticate);
// Read-only / utility routes allowed for STAFF as well
router.get('/customers', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), adminCustomer_controller_js_1.AdminCustomerController.listCustomers);
router.get('/customers-intelligence', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), adminCustomer_controller_js_1.AdminCustomerController.getCustomerIntelligence);
router.get('/customers/:id', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), adminCustomer_controller_js_1.AdminCustomerController.getCustomerDetails);
router.get('/orders-intelligence', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), admin_controller_js_1.AdminController.getOrderIntelligence);
router.get('/revenue-intelligence', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), admin_controller_js_1.AdminController.getRevenueIntelligence);
router.get('/promotions-intelligence', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), admin_controller_js_1.AdminController.getPromotionsIntelligence);
router.get('/inventory-intelligence', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), admin_controller_js_1.AdminController.getInventoryIntelligence);
router.post('/upload', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), upload_middleware_js_1.upload.single('image'), (0, upload_middleware_js_1.validateUpload)(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 5 * 1024 * 1024), admin_controller_js_1.AdminController.uploadImage);
router.post('/upload-video', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), upload_middleware_js_1.upload.single('video'), admin_controller_js_1.AdminController.uploadImage);
// Helper for other routes restricted to ADMIN & SUPERADMIN
const restrictToAdmin = (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN);
router.get('/dashboard', restrictToAdmin, admin_controller_js_1.AdminController.getDashboard);
router.post('/loyalty/adjust', restrictToAdmin, (0, validate_middleware_js_1.validate)(admin_controller_js_1.loyaltyAdjustSchema), admin_controller_js_1.AdminController.adjustPoints);
router.get('/loyalty/transactions', restrictToAdmin, admin_controller_js_1.AdminController.listPointTransactions);
router.get('/reports', restrictToAdmin, admin_controller_js_1.AdminController.getExtendedReports);
// Platform Settings & Audits
router.get('/settings', restrictToAdmin, admin_controller_js_1.AdminController.getSystemSettings);
router.put('/settings', restrictToAdmin, (0, validate_middleware_js_1.validate)(admin_controller_js_1.systemSettingsUpdateSchema), admin_controller_js_1.AdminController.saveSystemSettings);
router.get('/audits', restrictToAdmin, admin_controller_js_1.AdminController.getAuditLogs);
// Product Management CRUD
router.post('/products', restrictToAdmin, (0, validate_middleware_js_1.validate)(adminProduct_controller_js_1.productCreateSchema), adminProduct_controller_js_1.AdminProductController.createProduct);
router.put('/products/:id', restrictToAdmin, (0, validate_middleware_js_1.validate)(adminProduct_controller_js_1.productUpdateSchema), adminProduct_controller_js_1.AdminProductController.updateProduct);
router.delete('/products/:id', restrictToAdmin, adminProduct_controller_js_1.AdminProductController.deleteProduct);
router.put('/products/:id/trending', restrictToAdmin, (0, validate_middleware_js_1.validate)(adminProduct_controller_js_1.trendingToggleSchema), adminProduct_controller_js_1.AdminProductController.toggleTrending);
// Category Management CRUD & Ordering
router.post('/categories', restrictToAdmin, (0, validate_middleware_js_1.validate)(adminCategory_controller_js_1.categoryCreateSchema), adminCategory_controller_js_1.AdminCategoryController.createCategory);
router.put('/categories/reorder', restrictToAdmin, (0, validate_middleware_js_1.validate)(adminCategory_controller_js_1.categoriesReorderSchema), adminCategory_controller_js_1.AdminCategoryController.reorderCategories);
router.put('/categories/:id', restrictToAdmin, (0, validate_middleware_js_1.validate)(adminCategory_controller_js_1.categoryUpdateSchema), adminCategory_controller_js_1.AdminCategoryController.updateCategory);
router.delete('/categories/:id', restrictToAdmin, adminCategory_controller_js_1.AdminCategoryController.deleteCategory);
// Sub-Category Management CRUD
router.post('/categories/:categoryId/subcategories', restrictToAdmin, (0, validate_middleware_js_1.validate)(adminCategory_controller_js_1.subCategoryCreateSchema), adminCategory_controller_js_1.AdminCategoryController.createSubCategory);
router.put('/subcategories/:id', restrictToAdmin, (0, validate_middleware_js_1.validate)(adminCategory_controller_js_1.subCategoryUpdateSchema), adminCategory_controller_js_1.AdminCategoryController.updateSubCategory);
router.delete('/subcategories/:id', restrictToAdmin, adminCategory_controller_js_1.AdminCategoryController.deleteSubCategory);
// App Customer Management (Admin-created customers for the mobile app)
router.post('/customers', restrictToAdmin, (0, validate_middleware_js_1.validate)(adminCustomer_controller_js_1.appCustomerCreateSchema), adminCustomer_controller_js_1.AdminCustomerController.createCustomer);
router.put('/customers/:id', restrictToAdmin, (0, validate_middleware_js_1.validate)(adminCustomer_controller_js_1.appCustomerUpdateSchema), adminCustomer_controller_js_1.AdminCustomerController.updateCustomer);
router.delete('/customers/:id', restrictToAdmin, adminCustomer_controller_js_1.AdminCustomerController.deleteCustomer);
// Staff management (Read-only staff list allowed for STAFF; CRUD restricted to ADMIN/SUPERADMIN)
router.get('/users', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), admin_controller_js_1.AdminController.listStaff);
router.post('/users', restrictToAdmin, (0, validate_middleware_js_1.validate)(admin_controller_js_1.staffCreateSchema), admin_controller_js_1.AdminController.createStaff);
router.put('/users/:id', restrictToAdmin, (0, validate_middleware_js_1.validate)(admin_controller_js_1.userUpdateSchema), admin_controller_js_1.AdminController.updateStaff);
// Role management (Restricted to SUPERADMIN)
router.put('/users/:id/role', (0, auth_middleware_js_1.authorize)(client_1.Role.SUPERADMIN), (0, validate_middleware_js_1.validate)(admin_controller_js_1.userRoleUpdateSchema), admin_controller_js_1.AdminController.updateUserRole);
// Coupon management
router.get('/coupons', restrictToAdmin, admin_controller_js_1.AdminController.listCoupons);
router.post('/coupons', restrictToAdmin, (0, validate_middleware_js_1.validate)(admin_controller_js_1.couponCreateSchema), admin_controller_js_1.AdminController.createCoupon);
router.put('/coupons/:id/deactivate', restrictToAdmin, admin_controller_js_1.AdminController.deactivateCoupon);
// Offer management
router.get('/offers', restrictToAdmin, offer_controller_js_1.OfferController.listOffers);
router.post('/offers', restrictToAdmin, (0, validate_middleware_js_1.validate)(offer_controller_js_1.offerCreateSchema), offer_controller_js_1.OfferController.createOffer);
router.put('/offers/:id', restrictToAdmin, (0, validate_middleware_js_1.validate)(offer_controller_js_1.offerUpdateSchema), offer_controller_js_1.OfferController.updateOffer);
router.delete('/offers/:id', restrictToAdmin, offer_controller_js_1.OfferController.deleteOffer);
// Store Location management
router.get('/stores', restrictToAdmin, storeLocation_controller_js_1.StoreLocationController.listStores);
router.post('/stores', restrictToAdmin, (0, validate_middleware_js_1.validate)(storeLocation_controller_js_1.storeLocationCreateSchema), storeLocation_controller_js_1.StoreLocationController.createStore);
router.put('/stores/:id', restrictToAdmin, (0, validate_middleware_js_1.validate)(storeLocation_controller_js_1.storeLocationUpdateSchema), storeLocation_controller_js_1.StoreLocationController.updateStore);
router.delete('/stores/:id', restrictToAdmin, storeLocation_controller_js_1.StoreLocationController.deleteStore);
// Promo Content management
router.get('/promos', restrictToAdmin, promoContent_controller_js_1.PromoContentController.listPromos);
router.post('/promos', restrictToAdmin, (0, validate_middleware_js_1.validate)(promoContent_controller_js_1.promoCreateSchema), promoContent_controller_js_1.PromoContentController.createPromo);
router.put('/promos/:id', restrictToAdmin, (0, validate_middleware_js_1.validate)(promoContent_controller_js_1.promoUpdateSchema), promoContent_controller_js_1.PromoContentController.updatePromo);
router.delete('/promos/:id', restrictToAdmin, promoContent_controller_js_1.PromoContentController.deletePromo);
exports.default = router;
