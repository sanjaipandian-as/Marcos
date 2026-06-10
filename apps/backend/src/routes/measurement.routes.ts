import { Router } from 'express';
import { MeasurementController, measurementCreateSchema, measurementUpdateSchema } from '../controllers/measurement.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, MeasurementController.getMeasurements);
router.post('/', authenticate, validate(measurementCreateSchema), MeasurementController.createMeasurement);
router.delete('/:id', authenticate, MeasurementController.deleteMeasurement);

// Admin / Staff Only updates
router.put('/:id', authenticate, authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), validate(measurementUpdateSchema), MeasurementController.updateMeasurement);
router.get('/:id/history', authenticate, authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), MeasurementController.getHistory);

export default router;
