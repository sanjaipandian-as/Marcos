import { Router } from 'express';
import { BillingController, invoiceCreateSchema } from '../controllers/billing.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Staff / Admin invoice creation
router.post('/invoice', authenticate, authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), validate(invoiceCreateSchema), BillingController.createInvoice);

// Webhook endpoint (mounted raw body parser in app.ts)
router.post('/webhook/:gateway', BillingController.handleWebhook);

export default router;
