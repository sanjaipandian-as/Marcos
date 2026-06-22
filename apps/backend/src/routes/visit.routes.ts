import { Router } from 'express';
import { VisitController, visitCreateSchema, visitAssignSchema, visitUpdateSchema } from '../controllers/visit.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { upload, validateUpload } from '../middlewares/upload.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, VisitController.getVisits);
router.post('/', authenticate, validate(visitCreateSchema), VisitController.createVisit);
router.put('/:id', authenticate, validate(visitUpdateSchema), VisitController.updateVisit);

// Admin Only assignments
router.put('/:id/assign', authenticate, authorize(Role.ADMIN, Role.SUPERADMIN), validate(visitAssignSchema), VisitController.assignVisit);

// Staff / Admin status completions with image buffer upload validation
router.put(
  '/:id/status',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF),
  upload.array('images', 5),
  validateUpload(['image/jpeg', 'image/png'], 5 * 1024 * 1024), // image signature check, 5MB limit
  VisitController.updateStatus
);

export default router;
