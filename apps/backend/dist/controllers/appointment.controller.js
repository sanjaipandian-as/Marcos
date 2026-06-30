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
const redis_js_1 = __importDefault(require("../config/redis.js"));
exports.appointmentCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().datetime(),
        timeSlot: zod_1.z.string().min(1),
        productType: zod_1.z.string().min(1),
        type: zod_1.z.enum(['MEASUREMENT', 'CONSULTATION', 'PRODUCT_SELECTION']),
        notes: zod_1.z.string().optional(),
        userId: zod_1.z.string().uuid().optional(),
        adminOverride: zod_1.z.boolean().optional(),
        staffId: zod_1.z.string().uuid().optional(),
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
     * GET /appointments/availability
     */
    static async getAvailability(req, res, next) {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date query parameter is required' });
        }
        try {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid date format' });
            }
            const appointments = await db_js_1.default.appointment.groupBy({
                by: ['timeSlot'],
                where: {
                    date: parsedDate,
                    status: { in: ['PENDING', 'CONFIRMED'] },
                },
                _count: {
                    id: true,
                },
            });
            const availability = appointments.reduce((acc, curr) => {
                acc[curr.timeSlot] = curr._count.id;
                return acc;
            }, {});
            return res.status(200).json({
                success: true,
                data: availability,
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
        const { date, timeSlot, productType, type, notes, userId, adminOverride, staffId } = req.body;
        const appointmentDate = new Date(date);
        const lockKey = `lock:appointment:${appointmentDate.toISOString()}:${timeSlot}`;
        let lockAcquired = false;
        try {
            const settings = await db_js_1.default.systemSettings.findUnique({ where: { id: 'default' } });
            const maxSlots = settings?.maxBookingsPerSlot || 5;
            const bypassLimits = adminOverride && (user.role === client_1.Role.ADMIN || user.role === client_1.Role.SUPERADMIN || user.role === client_1.Role.STAFF);
            if (!bypassLimits) {
                // Acquire Redis lock
                for (let attempt = 0; attempt < 5; attempt++) {
                    const resLock = await redis_js_1.default.set(lockKey, 'locked', 'PX', 3000, 'NX');
                    if (resLock === 'OK') {
                        lockAcquired = true;
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
                }
                if (!lockAcquired) {
                    return res.status(429).json({
                        success: false,
                        message: 'Too many concurrent booking requests for this slot. Please try again.',
                    });
                }
            }
            // Check slot constraint to allow up to 5 bookings per slot
            const slotCount = await db_js_1.default.appointment.count({
                where: {
                    date: appointmentDate,
                    timeSlot,
                    status: { in: ['PENDING', 'CONFIRMED'] },
                },
            });
            if (slotCount >= maxSlots && !bypassLimits) {
                if (lockAcquired)
                    await redis_js_1.default.del(lockKey);
                return res.status(409).json({
                    success: false,
                    message: `The requested appointment slot is fully booked (maximum ${maxSlots} bookings). Please choose another time.`,
                });
            }
            let targetUserId = user.id;
            if (user.role !== client_1.Role.CUSTOMER) {
                targetUserId = userId || null;
            }
            const appointment = await db_js_1.default.appointment.create({
                data: {
                    userId: targetUserId,
                    date: appointmentDate,
                    timeSlot,
                    productType,
                    type: type,
                    notes,
                    assignedStaffId: staffId,
                },
                include: { user: { select: { fullName: true, email: true } }, assignedStaff: { select: { fullName: true } } },
            });
            if (lockAcquired) {
                await redis_js_1.default.del(lockKey);
            }
            // Broadcast appointment:created event to admins
            const io = (0, socket_handler_js_1.getIO)();
            if (io) {
                io.to('admins').emit('appointment:created', {
                    id: appointment.id,
                    customerName: appointment.user ? appointment.user.fullName : 'Walk-In Customer',
                    date: appointment.date,
                    timeSlot: appointment.timeSlot,
                    type: appointment.type,
                    assignedStaff: appointment.assignedStaff ? appointment.assignedStaff.fullName : null,
                });
            }
            return res.status(201).json({ success: true, data: appointment });
        }
        catch (error) {
            if (lockAcquired) {
                await redis_js_1.default.del(lockKey).catch(() => { });
            }
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
        let lockKey = null;
        let lockAcquired = false;
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
            // Check double-booking slot constraints if changing date/time (allow up to 5)
            if (date || timeSlot) {
                const checkDate = date ? new Date(date) : appointment.date;
                const checkSlot = timeSlot || appointment.timeSlot;
                lockKey = `lock:appointment:${new Date(checkDate).toISOString()}:${checkSlot}`;
                // Acquire Redis lock
                for (let attempt = 0; attempt < 5; attempt++) {
                    const resLock = await redis_js_1.default.set(lockKey, 'locked', 'PX', 3000, 'NX');
                    if (resLock === 'OK') {
                        lockAcquired = true;
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
                }
                if (!lockAcquired) {
                    return res.status(429).json({
                        success: false,
                        message: 'Too many concurrent booking requests for this slot. Please try again.',
                    });
                }
                const slotCount = await db_js_1.default.appointment.count({
                    where: {
                        id: { not: id },
                        date: checkDate,
                        timeSlot: checkSlot,
                        status: { in: ['PENDING', 'CONFIRMED'] },
                    },
                });
                const settings = await db_js_1.default.systemSettings.findUnique({ where: { id: 'default' } });
                const maxSlots = settings?.maxBookingsPerSlot || 5;
                if (slotCount >= maxSlots) {
                    if (lockAcquired)
                        await redis_js_1.default.del(lockKey);
                    return res.status(409).json({
                        success: false,
                        message: `Slot conflict: The updated time slot is fully booked (maximum ${maxSlots} bookings).`,
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
            if (lockAcquired && lockKey) {
                await redis_js_1.default.del(lockKey);
            }
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
            if (lockAcquired && lockKey) {
                await redis_js_1.default.del(lockKey).catch(() => { });
            }
            next(error);
        }
    }
}
exports.AppointmentController = AppointmentController;
