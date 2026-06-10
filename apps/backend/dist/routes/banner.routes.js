"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const banner_controller_js_1 = require("../controllers/banner.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Public endpoints
router.get('/', banner_controller_js_1.BannerController.getBanners);
router.post('/:id/click', banner_controller_js_1.BannerController.incrementClicks);
// Admin CRUD endpoints
router.get('/admin', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), banner_controller_js_1.BannerController.adminListBanners);
router.post('/admin', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), (0, validate_middleware_js_1.validate)(banner_controller_js_1.bannerCreateSchema), banner_controller_js_1.BannerController.createBanner);
router.put('/admin/:id', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), (0, validate_middleware_js_1.validate)(banner_controller_js_1.bannerUpdateSchema), banner_controller_js_1.BannerController.updateBanner);
router.delete('/admin/:id', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), banner_controller_js_1.BannerController.deleteBanner);
exports.default = router;
