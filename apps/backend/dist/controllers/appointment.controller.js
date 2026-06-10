"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = exports.appointmentUpdateSchema = exports.appointmentCreateSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
const client_1 = require("@prisma/client");
const socket_handler_js_1 = require("../socket/socket.handler.js");
const audit_js_1 = require("../utils/audit.js");
exports.appointmentCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().datetime(),
        timeSlot: zod_1.z.string().min(1),
        productType: zod_1.z.string().min(1),
        type: zod_1.z.enum(['MEASUREMENT', 'CONSULTATION', 'PRODUCT_SELECTION']),
        notes: zod_1.z.string().optional(),
    }),
});
exports.appointmentUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().datetime().optional(),
        timeSlot: zod_1.z.string().min(1).optional(),
        status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED']).optional(),
        notes: zod_1.z.string().optional(),
    }),
});
class AppointmentController {
    /**
     * GET /appointments
     */
    static async getAppointments(req, res, next) {
        const user = req.user;
        const { page = 1, limit = 10, status, startDate, endDate, userId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        try {
            const where = {};
            // Role check
            if (user.role === client_1.Role.CUSTOMER) {
                where.userId = user.id;
            }
            else {
                // Staff/Admin can filter by customer userId
                if (userId) {
                    where.userId = userId;
                }
            }
            if (status) {
                where.status = status;
            }
            if (startDate || endDate) {
                where.date = {};
                if (startDate)
                    where.date.gte = new Date(startDate);
                if (endDate)
                    where.date.lte = new Date(endDate);
            }
            const [appointments, total] = await Promise.all([
                db_js_1.default.appointment.findMany({
                    where,
                    orderBy: { date: 'asc' },
                    skip,
                    take: Number(limit),
                    include: { user: { select: { fullName: true, email: true, phoneNumber: true } } },
                }),
                db_js_1.default.appointment.count({ where }),
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /appointments
     */
    static async createAppointment(req, res, next) {
        const user = req.user;
        const { date, timeSlot, productType, type, notes } = req.body;
        try {
            const appointmentDate = new Date(date);
            // Check slot constraint to prevent double-booking
            const existingAppointment = await db_js_1.default.appointment.findFirst({
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
            const appointment = await db_js_1.default.appointment.create({
                data: {
                    userId: user.id,
                    date: appointmentDate,
                    timeSlot,
                    productType,
                    type: type,
                    notes,
                },
                include: { user: { select: { fullName: true, email: true } } },
            });
            // Broadcast appointment:created event to admins
            const io = (0, socket_handler_js_1.getIO)();
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /appointments/:id
     */
    static async updateAppointment(req, res, next) {
        const user = req.user;
        const { id } = req.params;
        const { date, timeSlot, status, notes } = req.body;
        try {
            const appointment = await db_js_1.default.appointment.findUnique({
                where: { id },
            });
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }
            // Check ownership
            if (appointment.userId !== user.id && user.role === client_1.Role.CUSTOMER) {
                return res.status(403).json({ success: false, message: 'Forbidden: You do not own this booking' });
            }
            // Enforce cancellation limit: Prevents cancellations if the start time is less than 2 hours away.
            if (status === 'CANCELLED' || status === client_1.AppointmentStatus.CANCELLED) {
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
                const conflict = await db_js_1.default.appointment.findFirst({
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
            const updated = await db_js_1.default.appointment.update({
                where: { id },
                data: {
                    ...(date && { date: new Date(date) }),
                    ...(timeSlot && { timeSlot }),
                    ...(status && { status: status }),
                    ...(notes !== undefined && { notes }),
                },
            });
            if ((status === 'CANCELLED' || status === client_1.AppointmentStatus.CANCELLED) && user.role !== client_1.Role.CUSTOMER) {
                await (0, audit_js_1.createAuditLog)({
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AppointmentController = AppointmentController;
