"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeasurementController = exports.measurementUpdateSchema = exports.measurementCreateSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
const client_1 = require("@prisma/client");
const audit_js_1 = require("../utils/audit.js");
const redis_js_1 = __importDefault(require("../config/redis.js"));
exports.measurementCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().uuid().optional(), // If Staff creates it, they specify userId
        profileName: zod_1.z.string().min(1),
        fullLength: zod_1.z.coerce.number().optional(),
        shoulderWidth: zod_1.z.coerce.number().optional(),
        upperChest: zod_1.z.coerce.number().optional(),
        bust: zod_1.z.coerce.number().optional(),
        waist: zod_1.z.coerce.number().optional(),
        hip: zod_1.z.coerce.number().optional(),
        armLength: zod_1.z.coerce.number().optional(),
        sleeveLength: zod_1.z.coerce.number().optional(),
        neck: zod_1.z.coerce.number().optional(),
        seat: zod_1.z.coerce.number().optional(),
        skirtLength: zod_1.z.coerce.number().optional(),
        pantLength: zod_1.z.coerce.number().optional(),
        tailorNotes: zod_1.z.string().optional(),
    }),
});
exports.measurementUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullLength: zod_1.z.coerce.number().optional(),
        shoulderWidth: zod_1.z.coerce.number().optional(),
        upperChest: zod_1.z.coerce.number().optional(),
        bust: zod_1.z.coerce.number().optional(),
        waist: zod_1.z.coerce.number().optional(),
        hip: zod_1.z.coerce.number().optional(),
        armLength: zod_1.z.coerce.number().optional(),
        sleeveLength: zod_1.z.coerce.number().optional(),
        neck: zod_1.z.coerce.number().optional(),
        seat: zod_1.z.coerce.number().optional(),
        skirtLength: zod_1.z.coerce.number().optional(),
        pantLength: zod_1.z.coerce.number().optional(),
        tailorNotes: zod_1.z.string().optional(),
    }),
});
class MeasurementController {
    /**
     * GET /measurements
     */
    static async getMeasurements(req, res, next) {
        const user = req.user;
        const targetUserId = req.query.userId;
        try {
            let queryUserId = user.id;
            if (user.role === client_1.Role.ADMIN || user.role === client_1.Role.SUPERADMIN || user.role === client_1.Role.STAFF) {
                if (targetUserId) {
                    queryUserId = targetUserId;
                }
                else {
                    // Admin/Staff fetching all profiles in database - this is a bulk export!
                    const profiles = await db_js_1.default.measurementProfile.findMany({
                        include: { user: { select: { fullName: true, email: true } } },
                    });
                    await (0, audit_js_1.createAuditLog)({
                        userId: user.id,
                        action: 'EXPORT_MEASUREMENTS',
                        ipAddress: req.ip,
                        details: {
                            message: `Admin/Staff ${user.fullName} exported ${profiles.length} measurement profiles in bulk.`,
                            count: profiles.length,
                        },
                    });
                    // Sliding window counter in Redis: alert if more than 10 records are exported within 10 seconds
                    const redisKey = `export_records_count:${user.id}`;
                    const currentCount = await redis_js_1.default.incrby(redisKey, profiles.length);
                    if (currentCount === profiles.length) {
                        await redis_js_1.default.expire(redisKey, 10);
                    }
                    if (currentCount > 10) {
                        await (0, audit_js_1.createAuditLog)({
                            userId: user.id,
                            action: 'EXPORT_MEASUREMENTS_ALERT',
                            ipAddress: req.ip,
                            details: {
                                message: `ALERT: More than 10 measurement records exported by admin/staff ${user.fullName} within 10 seconds. Total: ${currentCount}`,
                                userId: user.id,
                                totalExported: currentCount,
                            },
                        });
                    }
                    return res.status(200).json({ success: true, data: profiles });
                }
            }
            else {
                // Customer role
                if (targetUserId && targetUserId !== user.id) {
                    await (0, audit_js_1.createAuditLog)({
                        userId: user.id,
                        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                        ipAddress: req.ip,
                        details: {
                            message: `Customer ${user.email} attempted unauthorized access to measurements of user ID ${targetUserId}`,
                            userId: user.id,
                            targetPath: req.originalUrl,
                        },
                    });
                    return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
                }
            }
            const profiles = await db_js_1.default.measurementProfile.findMany({
                where: { userId: queryUserId },
            });
            return res.status(200).json({ success: true, data: profiles });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /measurements
     */
    static async createMeasurement(req, res, next) {
        const user = req.user;
        const { userId, profileName, ...measurements } = req.body;
        try {
            let targetUserId = user.id;
            // Staff/Admin can specify another customer's ID
            if (userId && (user.role === client_1.Role.ADMIN || user.role === client_1.Role.SUPERADMIN || user.role === client_1.Role.STAFF)) {
                targetUserId = userId;
            }
            const profile = await db_js_1.default.measurementProfile.create({
                data: {
                    userId: targetUserId,
                    profileName,
                    ...measurements,
                },
            });
            await (0, audit_js_1.createAuditLog)({
                userId: user.id,
                action: 'CREATE_MEASUREMENT_PROFILE',
                ipAddress: req.ip,
                details: {
                    message: `Measurement profile '${profileName}' created for customer ID ${targetUserId} by ${user.fullName}`,
                    profileId: profile.id,
                    profileName,
                    customerUserId: targetUserId,
                },
            });
            return res.status(201).json({ success: true, data: profile });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateMeasurement(req, res, next) {
        const user = req.user;
        const { id } = req.params;
        const updates = req.body;
        try {
            const existingProfile = await db_js_1.default.measurementProfile.findUnique({
                where: { id },
            });
            if (!existingProfile) {
                return res.status(404).json({ success: false, message: 'Measurement profile not found' });
            }
            // Record transaction
            const updatedProfile = await db_js_1.default.$transaction(async (tx) => {
                // 1. Update Profile
                const updated = await tx.measurementProfile.update({
                    where: { id },
                    data: updates,
                });
                // 2. Prepare snapshots
                const prevValues = {};
                const newValues = {};
                Object.keys(updates).forEach((key) => {
                    prevValues[key] = existingProfile[key];
                    newValues[key] = updated[key];
                });
                // 3. Save to History
                await tx.measurementHistory.create({
                    data: {
                        profileId: id,
                        changedBy: user.id,
                        previousValues: prevValues,
                        newValues,
                    },
                });
                // 4. Save to AuditLog
                await tx.auditLog.create({
                    data: {
                        userId: user.id,
                        action: 'UPDATE_MEASUREMENT',
                        ipAddress: req.ip,
                        details: {
                            message: `Staff member ${user.fullName} updated measurement profile '${existingProfile.profileName}' (Profile ID: ${id})`,
                            profileId: id,
                            profileName: existingProfile.profileName,
                            changedBy: user.id,
                            previousValues: prevValues,
                            newValues,
                        },
                    },
                });
                return updated;
            });
            return res.status(200).json({ success: true, data: updatedProfile });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /measurements/:id/history
     * Admin / Staff Only
     */
    static async getHistory(req, res, next) {
        const { id } = req.params;
        try {
            const history = await db_js_1.default.measurementHistory.findMany({
                where: { profileId: id },
                orderBy: { changedAt: 'desc' },
            });
            return res.status(200).json({ success: true, data: history });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /measurements/:id
     */
    static async deleteMeasurement(req, res, next) {
        const user = req.user;
        const { id } = req.params;
        try {
            const profile = await db_js_1.default.measurementProfile.findUnique({
                where: { id },
            });
            if (!profile) {
                return res.status(404).json({ success: false, message: 'Measurement profile not found' });
            }
            // Check ownership or role privilege
            if (profile.userId !== user.id && user.role === client_1.Role.CUSTOMER) {
                await (0, audit_js_1.createAuditLog)({
                    userId: user.id,
                    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                    ipAddress: req.ip,
                    details: {
                        message: `Customer ${user.email} attempted unauthorized deletion of measurement profile ID ${id} belonging to user ID ${profile.userId}`,
                        userId: user.id,
                        targetPath: req.originalUrl,
                    },
                });
                return res.status(403).json({ success: false, message: 'Forbidden: You do not own this profile' });
            }
            // Snapshot final values before delete
            const finalValues = {
                profileName: profile.profileName,
                fullLength: profile.fullLength,
                shoulderWidth: profile.shoulderWidth,
                upperChest: profile.upperChest,
                bust: profile.bust,
                waist: profile.waist,
                hip: profile.hip,
                armLength: profile.armLength,
                sleeveLength: profile.sleeveLength,
                neck: profile.neck,
                seat: profile.seat,
                skirtLength: profile.skirtLength,
                pantLength: profile.pantLength,
                tailorNotes: profile.tailorNotes,
            };
            await db_js_1.default.measurementProfile.delete({
                where: { id },
            });
            // Write to AuditLog
            await (0, audit_js_1.createAuditLog)({
                userId: user.id,
                action: 'DELETE_MEASUREMENT_PROFILE',
                ipAddress: req.ip,
                details: {
                    message: `User/Staff ${user.fullName} deleted measurement profile '${profile.profileName}' (Profile ID: ${id})`,
                    profileId: id,
                    profileName: profile.profileName,
                    finalValues,
                },
            });
            return res.status(200).json({
                success: true,
                message: 'Measurement profile deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MeasurementController = MeasurementController;
