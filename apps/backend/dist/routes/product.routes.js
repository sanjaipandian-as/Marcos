"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_js_1 = require("../controllers/product.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const router = (0, express_1.Router)();
// Cart
router.get('/cart', auth_middleware_js_1.authenticate, product_controller_js_1.ProductController.getCart);
router.post('/cart', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validate)(product_controller_js_1.cartAddSchema), product_controller_js_1.ProductController.addToCart);
router.delete('/cart/:productId', auth_middleware_js_1.authenticate, product_controller_js_1.ProductController.removeFromCart);
router.post('/cart/coupon', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validate)(product_controller_js_1.couponValidateSchema), product_controller_js_1.ProductController.validateCoupon);
// Favorites
router.get('/favorites', auth_middleware_js_1.authenticate, product_controller_js_1.ProductController.getFavorites);
router.post('/favorites', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validate)(product_controller_js_1.favoriteAddSchema), product_controller_js_1.ProductController.addToFavorites);
router.delete('/favorites/:productId', auth_middleware_js_1.authenticate, product_controller_js_1.ProductController.removeFromFavorites);
// Product catalog
router.get('/', (0, validate_middleware_js_1.validate)(product_controller_js_1.productQuerySchema), product_controller_js_1.ProductController.getProducts);
router.get('/:id', product_controller_js_1.ProductController.getProductById);
exports.default = router;
