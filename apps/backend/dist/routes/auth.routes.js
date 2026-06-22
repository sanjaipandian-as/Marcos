"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rateLimit_middleware_js_1 = require("../middlewares/rateLimit.middleware.js");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_middleware_js_1.validate)(auth_controller_js_1.registerSchema), auth_controller_js_1.AuthController.register);
router.post('/login', rateLimit_middleware_js_1.sensitiveRateLimiter, (0, validate_middleware_js_1.validate)(auth_controller_js_1.loginSchema), auth_controller_js_1.AuthController.login);
router.post('/otp/send', rateLimit_middleware_js_1.sensitiveRateLimiter, (0, validate_middleware_js_1.validate)(auth_controller_js_1.otpSendSchema), auth_controller_js_1.AuthController.sendOtp);
router.post('/otp/verify', rateLimit_middleware_js_1.sensitiveRateLimiter, (0, validate_middleware_js_1.validate)(auth_controller_js_1.otpVerifySchema), auth_controller_js_1.AuthController.verifyOtp);
router.post('/refresh', auth_controller_js_1.AuthController.refresh);
router.post('/logout', auth_middleware_js_1.authenticate, auth_controller_js_1.AuthController.logout);
// New Password Reset and Profile management routes
router.post('/forgot-password', rateLimit_middleware_js_1.sensitiveRateLimiter, (0, validate_middleware_js_1.validate)(auth_controller_js_1.forgotPasswordSchema), auth_controller_js_1.AuthController.forgotPassword);
router.post('/forgot-password/verify', rateLimit_middleware_js_1.sensitiveRateLimiter, (0, validate_middleware_js_1.validate)(auth_controller_js_1.verifyResetOtpSchema), auth_controller_js_1.AuthController.verifyResetOtp);
router.post('/reset-password', rateLimit_middleware_js_1.sensitiveRateLimiter, (0, validate_middleware_js_1.validate)(auth_controller_js_1.resetPasswordSchema), auth_controller_js_1.AuthController.resetPassword);
router.get('/profile', auth_middleware_js_1.authenticate, auth_controller_js_1.AuthController.getProfile);
router.put('/profile', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validate)(auth_controller_js_1.updateProfileSchema), auth_controller_js_1.AuthController.updateProfile);
router.post('/profile/verify-password', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validate)(auth_controller_js_1.verifyPasswordSchema), auth_controller_js_1.AuthController.verifyProfilePassword);
router.post('/profile/request-update', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validate)(auth_controller_js_1.requestContactUpdateSchema), auth_controller_js_1.AuthController.requestContactUpdate);
router.post('/profile/confirm-update', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validate)(auth_controller_js_1.confirmContactUpdateSchema), auth_controller_js_1.AuthController.confirmContactUpdate);
router.delete('/delete-account', auth_middleware_js_1.authenticate, auth_controller_js_1.AuthController.deleteAccount);
// Loyalty Points Redemption route
router.post('/loyalty/redeem', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validate)(auth_controller_js_1.redeemPointsSchema), auth_controller_js_1.AuthController.redeemPoints);
router.get('/loyalty/coupons', auth_middleware_js_1.authenticate, auth_controller_js_1.AuthController.listUserCoupons);
exports.default = router;
