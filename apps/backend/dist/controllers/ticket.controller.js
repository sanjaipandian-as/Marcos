"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketController = exports.ticketMessageCreateSchema = exports.ticketUpdateSchema = exports.ticketCreateSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
const r2_service_js_1 = require("../services/r2.service.js");
const email_service_js_1 = __importDefault(require("../services/email.service.js"));
exports.ticketCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        subject: zod_1.z.string().min(1),
        description: zod_1.z.string().min(1),
        imageUrl: zod_1.z.string().optional().nullable(),
    }),
});
exports.ticketUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    }),
});
exports.ticketMessageCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        text: zod_1.z.string().min(1),
    }),
});
class TicketController {
    /**
     * Helper: Send ticket status update notification email
     */
    static async sendStatusUpdateEmail(ticketId, status, subject, description, userEmail, userFullName) {
        try {
            let emailSubject = `MARCOS Support: Ticket Update - ID: ${ticketId}`;
            let text = '';
            let html = '';
            if (status === 'RESOLVED') {
                emailSubject = `MARCOS Support: Ticket Resolved - ID: ${ticketId}`;
                text = `Hello ${userFullName},\n\nOur support team has resolved your ticket.\n\nTicket Details:\n- Ticket ID: ${ticketId}\n- Subject: ${subject}\n- Description: ${description}\n\nThank you for reaching out to MARCOS. Let us know if you need any further assistance.\n\nBest regards,\nThe MARCOS Support Team`;
                html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
            <h2 style="color: #006241; margin-top: 0;">Issue Resolved!</h2>
            <p>Hello <strong>${userFullName}</strong>,</p>
            <p>Great news! Our support team has successfully resolved your ticket.</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
              <strong>Ticket ID:</strong> ${ticketId}<br/>
              <strong>Subject:</strong> ${subject}<br/>
              <strong>Status:</strong> RESOLVED
            </div>
            <p>You can view the resolution details and chat transcript in the MARCOS mobile app.</p>
            <p>Thank you for choosing MARCOS!</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
            <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">This is an automated message from MARCOS Support.</p>
          </div>
        `;
            }
            else {
                const statusLabel = status === 'IN_PROGRESS' ? 'In Progress' : status;
                text = `Hello ${userFullName},\n\nYour support ticket status has been updated to ${statusLabel}.\n\nTicket Details:\n- Ticket ID: ${ticketId}\n- Subject: ${subject}\n- Description: ${description}\n\nOur team is actively working on it. You can check updates in the mobile app.\n\nBest regards,\nThe MARCOS Support Team`;
                html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
            <h2 style="color: #1e293b; margin-top: 0;">Ticket Status Updated</h2>
            <p>Hello <strong>${userFullName}</strong>,</p>
            <p>Your support ticket status has been updated to <strong>${statusLabel}</strong>.</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 4px;">
              <strong>Ticket ID:</strong> ${ticketId}<br/>
              <strong>Subject:</strong> ${subject}<br/>
              <strong>Status:</strong> ${statusLabel}
            </div>
            <p>Our team is reviewing and addressing your request. You can track this and chat with support in the MARCOS mobile app.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
            <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">This is an automated message from MARCOS Support.</p>
          </div>
        `;
            }
            await email_service_js_1.default.sendEmail(userEmail, emailSubject, text, html);
        }
        catch (err) {
            console.error('Failed to send status update email:', err);
        }
    }
    /**
     * POST /tickets
     * Customer: creates a new support ticket
     */
    static async createTicket(req, res, next) {
        const { subject, description, imageUrl } = req.body;
        const userId = req.user.id;
        try {
            const ticket = await db_js_1.default.supportTicket.create({
                data: {
                    userId,
                    subject,
                    description,
                    imageUrl: imageUrl || null,
                    status: 'OPEN',
                },
            });
            // Send ticket confirmation email
            try {
                const emailSubject = `MARCOS Support: Ticket Raised - ID: ${ticket.id}`;
                const text = `Hello ${req.user.fullName},\n\nThank you for reaching out to us. We have successfully received your support ticket.\n\nTicket Details:\n- Ticket ID: ${ticket.id}\n- Subject: ${ticket.subject}\n- Description: ${ticket.description}\n\nOur team will review your request and solve the issue within 24 hours.\n\nBest regards,\nThe MARCOS Support Team`;
                const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
            <h2 style="color: #006241; margin-top: 0;">We've Received Your Support Ticket</h2>
            <p>Hello <strong>${req.user.fullName}</strong>,</p>
            <p>Thank you for reaching out to us. Your support ticket has been successfully created.</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #006241; padding: 16px; margin: 16px 0; border-radius: 4px;">
              <strong>Ticket ID:</strong> ${ticket.id}<br/>
              <strong>Subject:</strong> ${ticket.subject}<br/>
              <strong>Description:</strong> ${ticket.description}<br/>
              <strong>Status:</strong> OPEN
            </div>
            <p>Our team will investigate the issue and get back to you or resolve it within 24 hours.</p>
            <p>You can chat with our team directly regarding this ticket in the support section of the MARCOS app.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
            <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">This is an automated message from MARCOS Support.</p>
          </div>
        `;
                await email_service_js_1.default.sendEmail(req.user.email, emailSubject, text, html);
            }
            catch (err) {
                console.error('Failed to send ticket creation email:', err);
            }
            return res.status(201).json({
                success: true,
                message: 'Support ticket raised successfully',
                data: ticket,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /tickets
     * Customer: returns user's support tickets
     */
    static async getTickets(req, res, next) {
        const userId = req.user.id;
        try {
            const tickets = await db_js_1.default.supportTicket.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            return res.status(200).json({
                success: true,
                data: tickets,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /tickets/:id/messages
     * Customer: returns messages in a support ticket thread if they own the ticket
     */
    static async getCustomerTicketMessages(req, res, next) {
        const { id } = req.params;
        const userId = req.user.id;
        try {
            const ticket = await db_js_1.default.supportTicket.findFirst({
                where: { id, userId }
            });
            if (!ticket) {
                return res.status(404).json({ success: false, message: 'Ticket not found or access denied' });
            }
            const messages = await db_js_1.default.supportTicketMessage.findMany({
                where: { ticketId: id },
                orderBy: { sentAt: 'asc' },
            });
            return res.status(200).json({
                success: true,
                data: messages,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /tickets/:id/messages
     * Customer: sends a reply to a support ticket if they own the ticket
     */
    static async sendCustomerTicketMessage(req, res, next) {
        const { id } = req.params;
        const { text } = req.body;
        const user = req.user;
        try {
            const ticket = await db_js_1.default.supportTicket.findFirst({
                where: { id, userId: user.id }
            });
            if (!ticket) {
                return res.status(404).json({ success: false, message: 'Ticket not found or access denied' });
            }
            const message = await db_js_1.default.supportTicketMessage.create({
                data: {
                    ticketId: id,
                    sender: 'CUSTOMER',
                    senderName: user.fullName,
                    text,
                },
            });
            // Automatically change status back to OPEN if it was resolved or closed
            if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
                await db_js_1.default.supportTicket.update({
                    where: { id },
                    data: { status: 'OPEN' },
                });
            }
            return res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /admin/tickets (Admin/Staff Only)
     * Admin: lists all support tickets
     */
    static async adminListTickets(req, res, next) {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        try {
            const where = {};
            if (status) {
                where.status = status;
            }
            const [tickets, total] = await Promise.all([
                db_js_1.default.supportTicket.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit),
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                email: true,
                                phoneNumber: true,
                            },
                        },
                    },
                }),
                db_js_1.default.supportTicket.count({ where }),
            ]);
            return res.status(200).json({
                success: true,
                data: tickets,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /admin/tickets/:id (Admin/Staff Only)
     * Admin: updates support ticket status
     */
    static async adminUpdateTicket(req, res, next) {
        const { id } = req.params;
        const { status } = req.body;
        try {
            const existing = await db_js_1.default.supportTicket.findUnique({
                where: { id },
                include: { user: true }
            });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Ticket not found' });
            }
            const ticket = await db_js_1.default.supportTicket.update({
                where: { id },
                data: { status },
            });
            // Send email alert to user
            if (existing.user && existing.user.email) {
                await TicketController.sendStatusUpdateEmail(ticket.id, status, ticket.subject, ticket.description, existing.user.email, existing.user.fullName);
            }
            return res.status(200).json({
                success: true,
                message: 'Ticket status updated successfully',
                data: ticket,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /admin/tickets/:id/messages (Admin/Staff Only)
     * Admin: lists messages in a ticket thread
     */
    static async adminListTicketMessages(req, res, next) {
        const { id } = req.params;
        try {
            const existing = await db_js_1.default.supportTicket.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Ticket not found' });
            }
            const messages = await db_js_1.default.supportTicketMessage.findMany({
                where: { ticketId: id },
                orderBy: { sentAt: 'asc' },
            });
            return res.status(200).json({
                success: true,
                data: messages,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /admin/tickets/:id/messages (Admin/Staff Only)
     * Admin: sends/creates a reply in a support ticket
     */
    static async adminSendTicketMessage(req, res, next) {
        const { id } = req.params;
        const { text } = req.body;
        const adminUser = req.user;
        try {
            const ticket = await db_js_1.default.supportTicket.findUnique({ where: { id } });
            if (!ticket) {
                return res.status(404).json({ success: false, message: 'Ticket not found' });
            }
            const message = await db_js_1.default.supportTicketMessage.create({
                data: {
                    ticketId: id,
                    sender: 'ADMIN',
                    senderName: adminUser.fullName,
                    text,
                },
            });
            // Automatically update status to IN_PROGRESS if open
            if (ticket.status === 'OPEN') {
                await db_js_1.default.supportTicket.update({
                    where: { id },
                    data: { status: 'IN_PROGRESS' },
                });
                // Trigger email notification for status update
                const ticketOwner = await db_js_1.default.user.findUnique({ where: { id: ticket.userId } });
                if (ticketOwner && ticketOwner.email) {
                    await TicketController.sendStatusUpdateEmail(ticket.id, 'IN_PROGRESS', ticket.subject, ticket.description, ticketOwner.email, ticketOwner.fullName);
                }
            }
            return res.status(201).json({
                success: true,
                message: 'Reply sent successfully',
                data: message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /tickets/upload
     * Customer: uploads image file for support ticket
     */
    static async uploadTicketImage(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded.' });
            }
            const file = req.file;
            const fileKey = `tickets/${Date.now()}-${file.originalname}`;
            const url = await r2_service_js_1.R2Service.uploadFile(file.buffer, fileKey, file.mimetype);
            return res.status(200).json({
                success: true,
                data: { url },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TicketController = TicketController;
