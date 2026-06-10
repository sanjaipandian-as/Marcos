import { Router } from 'express';
import { AppointmentController, appointmentCreateSchema, appointmentUpdateSchema } from '../controllers/appointment.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, AppointmentController.getAppointments);
router.post('/', authenticate, validate(appointmentCreateSchema), AppointmentController.createAppointment);
router.put('/:id', authenticate, validate(appointmentUpdateSchema), AppointmentController.updateAppointment);

export default router;
