"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_js_1 = require("../controllers/order.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticate);
// Customer endpoints
router.get('/', order_controller_js_1.OrderController.getOrders);
router.post('/checkout', (0, validate_middleware_js_1.validate)(order_controller_js_1.orderCheckoutSchema), order_controller_js_1.OrderController.checkout);
// Admin / Staff endpoints — MUST be before /:id to prevent wildcard conflict
router.get('/admin/list', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), order_controller_js_1.OrderController.adminListOrders);
router.put('/admin/:id/status', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), (0, validate_middleware_js_1.validate)(order_controller_js_1.orderStatusUpdateSchema), order_controller_js_1.OrderController.adminUpdateOrderStatus);
router.put('/admin/:id/quick-status', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), order_controller_js_1.OrderController.adminUpdateQuickOrderStatus);
router.get('/admin/:id/packing-slip', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), order_controller_js_1.OrderController.adminGetPackingSlip);
// Dynamic /:id routes — MUST be after all static paths
router.get('/:id', order_controller_js_1.OrderController.getOrderById);
router.post('/:id/cancel', order_controller_js_1.OrderController.cancelOrder);
exports.default = router;
