"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const measurement_controller_js_1 = require("../controllers/measurement.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_js_1.authenticate, measurement_controller_js_1.MeasurementController.getMeasurements);
router.post('/', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validate)(measurement_controller_js_1.measurementCreateSchema), measurement_controller_js_1.MeasurementController.createMeasurement);
router.delete('/:id', auth_middleware_js_1.authenticate, measurement_controller_js_1.MeasurementController.deleteMeasurement);
// Admin / Staff Only updates
router.put('/:id', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), (0, validate_middleware_js_1.validate)(measurement_controller_js_1.measurementUpdateSchema), measurement_controller_js_1.MeasurementController.updateMeasurement);
router.get('/:id/history', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), measurement_controller_js_1.MeasurementController.getHistory);
exports.default = router;
