import { Router } from 'express';
import { TicketController, ticketCreateSchema, ticketUpdateSchema, ticketMessageCreateSchema } from '../controllers/ticket.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Customer endpoints
router.post('/', validate(ticketCreateSchema), TicketController.createTicket);
router.get('/', TicketController.getTickets);

// Admin / Staff endpoints
router.get('/admin', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), TicketController.adminListTickets);
router.put('/admin/:id', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), validate(ticketUpdateSchema), TicketController.adminUpdateTicket);
router.get('/admin/:id/messages', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), TicketController.adminListTicketMessages);
router.post('/admin/:id/messages', authorize(Role.ADMIN, Role.SUPERADMIN, Role.STAFF), validate(ticketMessageCreateSchema), TicketController.adminSendTicketMessage);

export default router;
