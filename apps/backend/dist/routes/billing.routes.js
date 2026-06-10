"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billing_controller_js_1 = require("../controllers/billing.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Staff / Admin invoice creation
router.post('/invoice', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), (0, validate_middleware_js_1.validate)(billing_controller_js_1.invoiceCreateSchema), billing_controller_js_1.BillingController.createInvoice);
// Webhook endpoint (mounted raw body parser in app.ts)
router.post('/webhook/:gateway', billing_controller_js_1.BillingController.handleWebhook);
exports.default = router;
