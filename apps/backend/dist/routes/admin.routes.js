"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_js_1 = require("../controllers/admin.controller.js");
const adminProduct_controller_js_1 = require("../controllers/adminProduct.controller.js");
const adminCategory_controller_js_1 = require("../controllers/adminCategory.controller.js");
const adminCustomer_controller_js_1 = require("../controllers/adminCustomer.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const upload_middleware_js_1 = require("../middlewares/upload.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Enforce Admin/SuperAdmin for all /admin routes
router.use(auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN));
router.get('/dashboard', admin_controller_js_1.AdminController.getDashboard);
router.post('/loyalty/adjust', (0, validate_middleware_js_1.validate)(admin_controller_js_1.loyaltyAdjustSchema), admin_controller_js_1.AdminController.adjustPoints);
router.get('/loyalty/transactions', admin_controller_js_1.AdminController.listPointTransactions);
router.get('/reports', admin_controller_js_1.AdminController.getExtendedReports);
// Platform Settings & Audits
router.get('/settings', admin_controller_js_1.AdminController.getSystemSettings);
router.put('/settings', (0, validate_middleware_js_1.validate)(admin_controller_js_1.systemSettingsUpdateSchema), admin_controller_js_1.AdminController.saveSystemSettings);
router.get('/audits', admin_controller_js_1.AdminController.getAuditLogs);
// Product Management CRUD
router.post('/products', (0, validate_middleware_js_1.validate)(adminProduct_controller_js_1.productCreateSchema), adminProduct_controller_js_1.AdminProductController.createProduct);
router.put('/products/:id', (0, validate_middleware_js_1.validate)(adminProduct_controller_js_1.productUpdateSchema), adminProduct_controller_js_1.AdminProductController.updateProduct);
router.delete('/products/:id', adminProduct_controller_js_1.AdminProductController.deleteProduct);
router.put('/products/:id/trending', (0, validate_middleware_js_1.validate)(adminProduct_controller_js_1.trendingToggleSchema), adminProduct_controller_js_1.AdminProductController.toggleTrending);
// Category Management CRUD & Ordering
router.post('/categories', (0, validate_middleware_js_1.validate)(adminCategory_controller_js_1.categoryCreateSchema), adminCategory_controller_js_1.AdminCategoryController.createCategory);
router.put('/categories/reorder', (0, validate_middleware_js_1.validate)(adminCategory_controller_js_1.categoriesReorderSchema), adminCategory_controller_js_1.AdminCategoryController.reorderCategories);
router.put('/categories/:id', (0, validate_middleware_js_1.validate)(adminCategory_controller_js_1.categoryUpdateSchema), adminCategory_controller_js_1.AdminCategoryController.updateCategory);
router.delete('/categories/:id', adminCategory_controller_js_1.AdminCategoryController.deleteCategory);
// Customer Management Panel
router.get('/customers', adminCustomer_controller_js_1.AdminCustomerController.listCustomers);
router.get('/customers/:id', adminCustomer_controller_js_1.AdminCustomerController.getCustomerDetails);
router.delete('/customers/:id', adminCustomer_controller_js_1.AdminCustomerController.deleteCustomer);
// Staff management (Create staff & update name/role)
router.get('/users', admin_controller_js_1.AdminController.listStaff);
router.post('/users', (0, validate_middleware_js_1.validate)(admin_controller_js_1.staffCreateSchema), admin_controller_js_1.AdminController.createStaff);
router.put('/users/:id', (0, validate_middleware_js_1.validate)(admin_controller_js_1.userUpdateSchema), admin_controller_js_1.AdminController.updateStaff);
router.post('/upload', upload_middleware_js_1.upload.single('image'), (0, upload_middleware_js_1.validateUpload)(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 5 * 1024 * 1024), admin_controller_js_1.AdminController.uploadImage);
// Role management (Restricted to SUPERADMIN)
router.put('/users/:id/role', (0, auth_middleware_js_1.authorize)(client_1.Role.SUPERADMIN), (0, validate_middleware_js_1.validate)(admin_controller_js_1.userRoleUpdateSchema), admin_controller_js_1.AdminController.updateUserRole);
// Coupon management
router.get('/coupons', admin_controller_js_1.AdminController.listCoupons);
router.post('/coupons', (0, validate_middleware_js_1.validate)(admin_controller_js_1.couponCreateSchema), admin_controller_js_1.AdminController.createCoupon);
router.put('/coupons/:id/deactivate', admin_controller_js_1.AdminController.deactivateCoupon);
exports.default = router;
