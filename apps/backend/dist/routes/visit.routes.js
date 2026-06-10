"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const visit_controller_js_1 = require("../controllers/visit.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const upload_middleware_js_1 = require("../middlewares/upload.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_js_1.authenticate, visit_controller_js_1.VisitController.getVisits);
router.post('/', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validate)(visit_controller_js_1.visitCreateSchema), visit_controller_js_1.VisitController.createVisit);
// Admin Only assignments
router.put('/:id/assign', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN), (0, validate_middleware_js_1.validate)(visit_controller_js_1.visitAssignSchema), visit_controller_js_1.VisitController.assignVisit);
// Staff / Admin status completions with image buffer upload validation
router.put('/:id/status', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), upload_middleware_js_1.upload.array('images', 5), (0, upload_middleware_js_1.validateUpload)(['image/jpeg', 'image/png'], 5 * 1024 * 1024), // image signature check, 5MB limit
visit_controller_js_1.VisitController.updateStatus);
exports.default = router;
