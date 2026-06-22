"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitController = exports.visitUpdateSchema = exports.visitAssignSchema = exports.visitCreateSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
const client_1 = require("@prisma/client");
const r2_service_js_1 = __importDefault(require("../services/r2.service.js"));
const socket_handler_js_1 = require("../socket/socket.handler.js");
const audit_js_1 = require("../utils/audit.js");
exports.visitCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        preferredDate: zod_1.z.string().datetime(),
        address: zod_1.z.string().min(1),
        requirements: zod_1.z.string().min(1),
    }),
});
exports.visitAssignSchema = zod_1.z.object({
    body: zod_1.z.object({
        assignedStaffId: zod_1.z.string().uuid(),
        confirmedDate: zod_1.z.string().datetime(),
    }),
});
exports.visitUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        preferredDate: zod_1.z.string().datetime().optional(),
        confirmedDate: zod_1.z.string().datetime().optional(),
        address: zod_1.z.string().min(1).optional(),
        requirements: zod_1.z.string().min(1).optional(),
        status: zod_1.z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    }),
});
class VisitController {
    /**
     * GET /visits
     */
    static async getVisits(req, res, next) {
        const user = req.user;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        try {
            const where = {};
            if (user.role === client_1.Role.CUSTOMER) {
                where.customerId = user.id;
            }
            const [visits, total] = await Promise.all([
                db_js_1.default.storeVisit.findMany({
                    where,
                    orderBy: { preferredDate: 'asc' },
                    skip,
                    take: Number(limit),
                    include: {
                        customer: {
                            select: {
                                fullName: true,
                                email: true,
                                phoneNumber: true,
                            },
                        },
                        assignedStaff: {
                            select: {
                                fullName: true,
                            },
                        },
                        report: true,
                    },
                }),
                db_js_1.default.storeVisit.count({ where }),
            ]);
            return res.status(200).json({
                success: true,
                data: visits,
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
     * POST /visits
     */
    static async createVisit(req, res, next) {
        const user = req.user;
        const { preferredDate, address, requirements } = req.body;
        try {
            const visit = await db_js_1.default.storeVisit.create({
                data: {
                    customerId: user.id,
                    preferredDate: new Date(preferredDate),
                    address,
                    requirements,
                },
            });
            // Broadcast to admins
            const io = (0, socket_handler_js_1.getIO)();
            if (io) {
                io.to('admins').emit('visit:status_changed', {
                    visitId: visit.id,
                    status: visit.status,
                });
            }
            return res.status(201).json({ success: true, data: visit });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /visits/:id/assign
     * Admin Only
     */
    static async assignVisit(req, res, next) {
        const { id } = req.params;
        const { assignedStaffId, confirmedDate } = req.body;
        try {
            const visit = await db_js_1.default.storeVisit.findUnique({ where: { id } });
            if (!visit) {
                return res.status(404).json({ success: false, message: 'Store visit request not found' });
            }
            const staff = await db_js_1.default.user.findUnique({ where: { id: assignedStaffId } });
            if (!staff || (staff.role !== client_1.Role.STAFF && staff.role !== client_1.Role.ADMIN)) {
                return res.status(400).json({ success: false, message: 'Invalid staff assignment: Assigned user must be STAFF or ADMIN' });
            }
            const updatedVisit = await db_js_1.default.storeVisit.update({
                where: { id },
                data: {
                    assignedStaffId,
                    confirmedDate: new Date(confirmedDate),
                    status: client_1.VisitStatus.ASSIGNED,
                },
            });
            // Log assignment in AuditLog
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'STAFF_ASSIGNED_TO_VISIT',
                ipAddress: req.ip,
                details: {
                    message: `Admin ${req.user.fullName} assigned staff member ${staff.fullName} (ID: ${assignedStaffId}) to store visit request ${id}`,
                    visitId: id,
                    assignedStaffId,
                    confirmedDate,
                },
            });
            // Broadcast WebSocket notification to Staff, Customer and Admins
            const io = (0, socket_handler_js_1.getIO)();
            if (io) {
                io.to(`user:${visit.customerId}`).to(`user:${assignedStaffId}`).to('admins').emit('visit:status_changed', {
                    visitId: updatedVisit.id,
                    status: updatedVisit.status,
                    confirmedDate: updatedVisit.confirmedDate,
                });
            }
            return res.status(200).json({ success: true, data: updatedVisit });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /visits/:id/status
     * Staff / Admin Only
     * Handle completion and multipart image upload
     */
    static async updateStatus(req, res, next) {
        const user = req.user;
        const { id } = req.params;
        const { status, completionNotes } = req.body;
        const files = req.files;
        try {
            const visit = await db_js_1.default.storeVisit.findUnique({
                where: { id },
            });
            if (!visit) {
                return res.status(404).json({ success: false, message: 'Store visit not found' });
            }
            // Authorization check (Must be assigned staff or admin)
            if (visit.assignedStaffId !== user.id && user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.SUPERADMIN) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this visit request' });
            }
            if (status === 'COMPLETED' || status === client_1.VisitStatus.COMPLETED) {
                if (!completionNotes) {
                    return res.status(400).json({ success: false, message: 'Completion notes are required to complete a visit' });
                }
                // Upload verification photos to R2
                let mediaUrls = [];
                if (req.body.mediaUrls) {
                    try {
                        mediaUrls = Array.isArray(req.body.mediaUrls) ? req.body.mediaUrls : JSON.parse(req.body.mediaUrls);
                    }
                    catch (e) {
                        if (typeof req.body.mediaUrls === 'string') {
                            mediaUrls = [req.body.mediaUrls];
                        }
                    }
                }
                if (files && files.length > 0) {
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const fileKey = `visits/${visit.id}/report-img-${i}-${Date.now()}`;
                        const url = await r2_service_js_1.default.uploadFile(file.buffer, fileKey, file.mimetype);
                        mediaUrls.push(url);
                    }
                }
                // Write visit report and complete inside a transaction
                const updatedVisit = await db_js_1.default.$transaction(async (tx) => {
                    // Update visit state
                    const updated = await tx.storeVisit.update({
                        where: { id },
                        data: { status: client_1.VisitStatus.COMPLETED },
                    });
                    // Generate Report
                    await tx.visitReport.create({
                        data: {
                            visitId: id,
                            staffId: user.id,
                            completionNotes,
                            mediaUrls,
                        },
                    });
                    return updated;
                });
                // Broadcast completions
                const io = (0, socket_handler_js_1.getIO)();
                if (io) {
                    io.to(`user:${visit.customerId}`).to('admins').emit('visit:status_changed', {
                        visitId: updatedVisit.id,
                        status: updatedVisit.status,
                    });
                }
                return res.status(200).json({ success: true, data: updatedVisit });
            }
            // Simple status update (e.g. IN_PROGRESS)
            const updatedVisit = await db_js_1.default.storeVisit.update({
                where: { id },
                data: { status: status },
            });
            const io = (0, socket_handler_js_1.getIO)();
            if (io) {
                io.to(`user:${visit.customerId}`).to('admins').emit('visit:status_changed', {
                    visitId: updatedVisit.id,
                    status: updatedVisit.status,
                });
            }
            return res.status(200).json({ success: true, data: updatedVisit });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /visits/:id
     * General update for store visit (e.g. rescheduling)
     */
    static async updateVisit(req, res, next) {
        const user = req.user;
        const { id } = req.params;
        const { preferredDate, confirmedDate, address, requirements, status } = req.body;
        try {
            const visit = await db_js_1.default.storeVisit.findUnique({
                where: { id },
            });
            if (!visit) {
                return res.status(404).json({ success: false, message: 'Store visit not found' });
            }
            // Check ownership/permissions
            if (visit.customerId !== user.id && user.role === client_1.Role.CUSTOMER) {
                return res.status(403).json({ success: false, message: 'Forbidden: You do not own this visit request' });
            }
            // Reset to PENDING if user reschedules so admin can re-confirm/assign staff
            let targetStatus = status;
            if (preferredDate && user.role === client_1.Role.CUSTOMER) {
                targetStatus = 'PENDING';
            }
            const updated = await db_js_1.default.storeVisit.update({
                where: { id },
                data: {
                    ...(preferredDate && { preferredDate: new Date(preferredDate) }),
                    ...(confirmedDate && { confirmedDate: new Date(confirmedDate) }),
                    ...(address && { address }),
                    ...(requirements && { requirements }),
                    ...(targetStatus && { status: targetStatus }),
                },
            });
            // Broadcast WebSocket notification to Staff, Customer and Admins
            const io = (0, socket_handler_js_1.getIO)();
            if (io) {
                io.to(`user:${visit.customerId}`).to('admins').emit('visit:status_changed', {
                    visitId: updated.id,
                    status: updated.status,
                    preferredDate: updated.preferredDate,
                    confirmedDate: updated.confirmedDate,
                });
            }
            return res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.VisitController = VisitController;
