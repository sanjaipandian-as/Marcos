import { Router } from 'express';
import { TicketController, ticketCreateSchema, ticketUpdateSchema, ticketMessageCreateSchema } from '../controllers/ticket.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { upload, validateUpload } from '../middlewares/upload.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Customer endpoints
router.post('/', validate(ticketCreateSchema), TicketController.createTicket);
router.post('/upload', upload.single('image'), validateUpload(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 5 * 1024 * 1024), TicketController.uploadTicketImage);
router.get('/', TicketController.getTickets);
router.get('/:id/messages', TicketController.getCustomerTicketMessages);
router.post('/:id/messages', validate(ticketMessageCreateSchema), TicketController.sendCustomerTicketMessage);

// Admin / Staff endpoints
router.get('/admin', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), TicketController.adminListTickets);
router.put('/admin/:id', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), validate(ticketUpdateSchema), TicketController.adminUpdateTicket);
router.get('/admin/:id/messages', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), TicketController.adminListTicketMessages);
router.post('/admin/:id/messages', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), validate(ticketMessageCreateSchema), TicketController.adminSendTicketMessage);

export default router;
