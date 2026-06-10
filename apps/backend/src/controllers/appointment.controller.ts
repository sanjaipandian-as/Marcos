import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { Role, AppointmentStatus, AppointmentType } from '@prisma/client';
import { getIO } from '../socket/socket.handler.js';
import { createAuditLog } from '../utils/audit.js';

export const appointmentCreateSchema = z.object({
  body: z.object({
    date: z.string().datetime(),
    timeSlot: z.string().min(1),
    productType: z.string().min(1),
    type: z.enum(['MEASUREMENT', 'CONSULTATION', 'PRODUCT_SELECTION']),
    notes: z.string().optional(),
  }),
});

export const appointmentUpdateSchema = z.object({
  body: z.object({
    date: z.string().datetime().optional(),
    timeSlot: z.string().min(1).optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED']).optional(),
    notes: z.string().optional(),
  }),
});

export class AppointmentController {
  /**
   * GET /appointments
   */
  static async getAppointments(req: Request, res: Response, next: NextFunction) {
    const user = req.user!;
    const { page = 1, limit = 10, status, startDate, endDate, userId } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    try {
      const where: any = {};

      // Role check
      if (user.role === Role.CUSTOMER) {
        where.userId = user.id;
      } else {
        // Staff/Admin can filter by customer userId
        if (userId) {
          where.userId = userId;
        }
      }

      if (status) {
        where.status = status as AppointmentStatus;
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          orderBy: { date: 'asc' },
          skip,
          take: Number(limit),
          include: { user: { select: { fullName: true, email: true, phoneNumber: true } } },
        }),
        prisma.appointment.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: appointments,
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
   * POST /appointments
   */
  static async createAppointment(req: Request, res: Response, next: NextFunction) {
    const user = req.user!;
    const { date, timeSlot, productType, type, notes } = req.body;

    try {
      const appointmentDate = new Date(date);

      // Check slot constraint to prevent double-booking
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          date: appointmentDate,
          timeSlot,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (existingAppointment) {
        return res.status(409).json({
          success: false,
          message: 'The requested appointment slot is already booked. Please choose another time.',
        });
      }

      const appointment = await prisma.appointment.create({
        data: {
          userId: user.id,
          date: appointmentDate,
          timeSlot,
          productType,
          type: type as AppointmentType,
          notes,
        },
        include: { user: { select: { fullName: true, email: true } } },
      });

      // Broadcast appointment:created event to admins
      const io = getIO();
      if (io) {
        io.to('admins').emit('appointment:created', {
          id: appointment.id,
          customerName: appointment.user.fullName,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          type: appointment.type,
        });
      }

      return res.status(201).json({ success: true, data: appointment });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /appointments/:id
   */
  static async updateAppointment(req: Request, res: Response, next: NextFunction) {
    const user = req.user!;
    const { id } = req.params;
    const { date, timeSlot, status, notes } = req.body;

    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      // Check ownership
      if (appointment.userId !== user.id && user.role === Role.CUSTOMER) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not own this booking' });
      }

      // Enforce cancellation limit: Prevents cancellations if the start time is less than 2 hours away.
      if (status === 'CANCELLED' || status === AppointmentStatus.CANCELLED) {
        const appointmentTime = new Date(appointment.date).getTime();
        const differenceMs = appointmentTime - Date.now();
        const twoHoursMs = 2 * 60 * 60 * 1000;

        if (differenceMs < twoHoursMs) {
          return res.status(400).json({
            success: false,
            message: 'Cancellations are not permitted less than 2 hours prior to the scheduled slot.',
          });
        }
      }

      // Check double-booking slot constraints if changing date/time
      if (date || timeSlot) {
        const checkDate = date ? new Date(date) : appointment.date;
        const checkSlot = timeSlot || appointment.timeSlot;

        const conflict = await prisma.appointment.findFirst({
          where: {
            id: { not: id },
            date: checkDate,
            timeSlot: checkSlot,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
        });

        if (conflict) {
          return res.status(409).json({
            success: false,
            message: 'Slot conflict: The updated time slot is already booked.',
          });
        }
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          ...(date && { date: new Date(date) }),
          ...(timeSlot && { timeSlot }),
          ...(status && { status: status as AppointmentStatus }),
          ...(notes !== undefined && { notes }),
        },
      });

      if ((status === 'CANCELLED' || status === AppointmentStatus.CANCELLED) && user.role !== Role.CUSTOMER) {
        await createAuditLog({
          userId: user.id,
          action: 'APPOINTMENT_CANCELLED_BY_ADMIN',
          ipAddress: req.ip,
          details: {
            message: `Admin/Staff ${user.fullName} force-cancelled appointment ID ${id} for customer ID ${appointment.userId}`,
            appointmentId: id,
            customerId: appointment.userId,
            cancelledBy: user.id,
          },
        });
      }

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}
