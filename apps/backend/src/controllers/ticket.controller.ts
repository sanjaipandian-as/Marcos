import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { TicketStatus } from '@prisma/client';

export const ticketCreateSchema = z.object({
  body: z.object({
    subject: z.string().min(1),
    description: z.string().min(1),
  }),
});

export const ticketUpdateSchema = z.object({
  body: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  }),
});

export const ticketMessageCreateSchema = z.object({
  body: z.object({
    text: z.string().min(1),
  }),
});

export class TicketController {
  /**
   * POST /tickets
   * Customer: creates a new support ticket
   */
  static async createTicket(req: Request, res: Response, next: NextFunction) {
    const { subject, description } = req.body;
    const userId = req.user!.id;

    try {
      const ticket = await prisma.supportTicket.create({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tickets
   * Customer: returns user's support tickets
   */
  static async getTickets(req: Request, res: Response, next: NextFunction) {
    const userId = req.user!.id;

    try {
      const tickets = await prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/tickets (Admin/Staff Only)
   * Admin: lists all support tickets
   */
  static async adminListTickets(req: Request, res: Response, next: NextFunction) {
    const { page = 1, limit = 10, status } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    try {
      const where: any = {};
      if (status) {
        where.status = status as TicketStatus;
      }

      const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
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
        prisma.supportTicket.count({ where }),
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/tickets/:id (Admin/Staff Only)
   * Admin: updates support ticket status
   */
  static async adminUpdateTicket(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const existing = await prisma.supportTicket.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }

      const ticket = await prisma.supportTicket.update({
        where: { id },
        data: { status },
      });

      return res.status(200).json({
        success: true,
        message: 'Ticket status updated successfully',
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/tickets/:id/messages (Admin/Staff Only)
   * Admin: lists messages in a ticket thread
   */
  static async adminListTicketMessages(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const existing = await prisma.supportTicket.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }

      const messages = await prisma.supportTicketMessage.findMany({
        where: { ticketId: id },
        orderBy: { sentAt: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/tickets/:id/messages (Admin/Staff Only)
   * Admin: sends/creates a reply in a support ticket
   */
  static async adminSendTicketMessage(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const { text } = req.body;
    const adminUser = req.user!;

    try {
      const ticket = await prisma.supportTicket.findUnique({ where: { id } });
      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }

      const message = await prisma.supportTicketMessage.create({
        data: {
          ticketId: id,
          sender: 'ADMIN',
          senderName: adminUser.fullName,
          text,
        },
      });

      // Automatically update status to IN_PROGRESS if open
      if (ticket.status === 'OPEN') {
        await prisma.supportTicket.update({
          where: { id },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Reply sent successfully',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
}
