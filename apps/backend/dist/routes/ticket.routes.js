"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticket_controller_js_1 = require("../controllers/ticket.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const upload_middleware_js_1 = require("../middlewares/upload.middleware.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticate);
// Customer endpoints
router.post('/', (0, validate_middleware_js_1.validate)(ticket_controller_js_1.ticketCreateSchema), ticket_controller_js_1.TicketController.createTicket);
router.post('/upload', upload_middleware_js_1.upload.single('image'), (0, upload_middleware_js_1.validateUpload)(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 5 * 1024 * 1024), ticket_controller_js_1.TicketController.uploadTicketImage);
router.get('/', ticket_controller_js_1.TicketController.getTickets);
router.get('/:id/messages', ticket_controller_js_1.TicketController.getCustomerTicketMessages);
router.post('/:id/messages', (0, validate_middleware_js_1.validate)(ticket_controller_js_1.ticketMessageCreateSchema), ticket_controller_js_1.TicketController.sendCustomerTicketMessage);
// Admin / Staff endpoints
router.get('/admin', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), ticket_controller_js_1.TicketController.adminListTickets);
router.put('/admin/:id', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), (0, validate_middleware_js_1.validate)(ticket_controller_js_1.ticketUpdateSchema), ticket_controller_js_1.TicketController.adminUpdateTicket);
router.get('/admin/:id/messages', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), ticket_controller_js_1.TicketController.adminListTicketMessages);
router.post('/admin/:id/messages', (0, auth_middleware_js_1.authorize)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.STAFF), (0, validate_middleware_js_1.validate)(ticket_controller_js_1.ticketMessageCreateSchema), ticket_controller_js_1.TicketController.adminSendTicketMessage);
exports.default = router;
