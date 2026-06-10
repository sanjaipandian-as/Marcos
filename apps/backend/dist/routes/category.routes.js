"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminCategory_controller_js_1 = require("../controllers/adminCategory.controller.js");
const router = (0, express_1.Router)();
router.get('/', adminCategory_controller_js_1.AdminCategoryController.listCategories);
exports.default = router;
