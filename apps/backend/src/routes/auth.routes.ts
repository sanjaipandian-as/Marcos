import { Router } from 'express';
import { 
  AuthController, 
  registerSchema, 
  loginSchema, 
  checkIdentifierSchema,
  setupPasswordSchema,
  otpSendSchema, 
  otpVerifySchema, 
  forgotPasswordSchema, 
  resetPasswordSchema, 
  updateProfileSchema, 
  verifyResetOtpSchema, 
  redeemPointsSchema,
  requestContactUpdateSchema,
  confirmContactUpdateSchema,
  verifyPasswordSchema
} from '../controllers/auth.controller.js';
import { VoucherPlanController } from '../controllers/voucherPlan.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { sensitiveRateLimiter, identifyIpLimiter, identifyTargetLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login/check', identifyIpLimiter, identifyTargetLimiter, validate(checkIdentifierSchema), AuthController.checkIdentifier);
router.post('/login', sensitiveRateLimiter, validate(loginSchema), AuthController.login);
router.post('/setup-password', sensitiveRateLimiter, validate(setupPasswordSchema), AuthController.setupPassword);
router.post('/otp/send', sensitiveRateLimiter, validate(otpSendSchema), AuthController.sendOtp);
router.post('/otp/verify', sensitiveRateLimiter, validate(otpVerifySchema), AuthController.verifyOtp);
router.post('/refresh', AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);

// New Password Reset and Profile management routes
router.post('/forgot-password', sensitiveRateLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/forgot-password/verify', sensitiveRateLimiter, validate(verifyResetOtpSchema), AuthController.verifyResetOtp);
router.post('/reset-password', sensitiveRateLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), AuthController.updateProfile);
router.post('/profile/verify-password', authenticate, validate(verifyPasswordSchema), AuthController.verifyProfilePassword);
router.post('/profile/request-update', authenticate, validate(requestContactUpdateSchema), AuthController.requestContactUpdate);
router.post('/profile/confirm-update', authenticate, validate(confirmContactUpdateSchema), AuthController.confirmContactUpdate);
router.delete('/delete-account', authenticate, AuthController.deleteAccount);

// Loyalty Points Redemption route
router.post('/loyalty/redeem', authenticate, validate(redeemPointsSchema), AuthController.redeemPoints);
router.get('/loyalty/coupons', authenticate, AuthController.listUserCoupons);

// Voucher Plans Management routes
router.get('/loyalty/voucher-plans', authenticate, VoucherPlanController.listVoucherPlans);
router.get('/admin/loyalty/voucher-plans', authenticate, VoucherPlanController.adminListVoucherPlans);
router.post('/admin/loyalty/voucher-plans', authenticate, VoucherPlanController.adminCreateVoucherPlan);
router.delete('/admin/loyalty/voucher-plans/:id', authenticate, VoucherPlanController.adminDeactivateVoucherPlan);

export default router;
