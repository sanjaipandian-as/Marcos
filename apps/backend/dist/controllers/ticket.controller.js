"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketController = exports.ticketMessageCreateSchema = exports.ticketUpdateSchema = exports.ticketCreateSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
exports.ticketCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        subject: zod_1.z.string().min(1),
        description: zod_1.z.string().min(1),
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
     * POST /tickets
     * Customer: creates a new support ticket
     */
    static async createTicket(req, res, next) {
        const { subject, description } = req.body;
        const userId = req.user.id;
        try {
            const ticket = await db_js_1.default.supportTicket.create({
                data: {
                    userId,
                    subject,
                    description,
                    status: 'OPEN',
                },
            });
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
            const existing = await db_js_1.default.supportTicket.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Ticket not found' });
            }
            const ticket = await db_js_1.default.supportTicket.update({
                where: { id },
                data: { status },
            });
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
}
exports.TicketController = TicketController;
