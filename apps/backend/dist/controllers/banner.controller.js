"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannerController = exports.bannerUpdateSchema = exports.bannerCreateSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
const audit_js_1 = require("../utils/audit.js");
exports.bannerCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        imageUrl: zod_1.z.string().url(),
        title: zod_1.z.string().optional().nullable(),
        targetUrl: zod_1.z.string().optional().nullable(),
        location: zod_1.z.enum(['HOME_SLIDER', 'PROMOTIONAL_SECTION', 'OFFER_SECTION']),
        scheduledStart: zod_1.z.string().datetime().optional().nullable(),
        scheduledEnd: zod_1.z.string().datetime().optional().nullable(),
        isActive: zod_1.z.boolean().default(true),
    }),
});
exports.bannerUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        imageUrl: zod_1.z.string().url().optional(),
        title: zod_1.z.string().optional().nullable(),
        targetUrl: zod_1.z.string().optional().nullable(),
        location: zod_1.z.enum(['HOME_SLIDER', 'PROMOTIONAL_SECTION', 'OFFER_SECTION']).optional(),
        scheduledStart: zod_1.z.string().datetime().optional().nullable(),
        scheduledEnd: zod_1.z.string().datetime().optional().nullable(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
class BannerController {
    /**
     * GET /banners
     * Public: returns active banners. If filters are provided, applies them.
     */
    static async getBanners(req, res, next) {
        const { location } = req.query;
        try {
            const now = new Date();
            const where = {
                isActive: true,
                OR: [
                    { scheduledStart: null, scheduledEnd: null },
                    {
                        scheduledStart: { lte: now },
                        scheduledEnd: { gte: now },
                    },
                ],
            };
            if (location) {
                where.location = location;
            }
            const banners = await db_js_1.default.banner.findMany({
                where,
                orderBy: { createdAt: 'desc' },
            });
            return res.status(200).json({
                success: true,
                data: banners,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /banners/admin (Admin / Staff Only)
     */
    static async adminListBanners(req, res, next) {
        try {
            const banners = await db_js_1.default.banner.findMany({
                orderBy: { createdAt: 'desc' },
            });
            return res.status(200).json({
                success: true,
                data: banners,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /banners/:id/click
     * Public: Increments banner click analytics
     */
    static async incrementClicks(req, res, next) {
        const { id } = req.params;
        try {
            const banner = await db_js_1.default.banner.findUnique({ where: { id } });
            if (!banner) {
                return res.status(404).json({ success: false, message: 'Banner not found' });
            }
            await db_js_1.default.banner.update({
                where: { id },
                data: { clicks: { increment: 1 } },
            });
            return res.status(200).json({
                success: true,
                message: 'Click registered successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /admin/banners (Admin Only)
     */
    static async createBanner(req, res, next) {
        const { imageUrl, title, targetUrl, location, scheduledStart, scheduledEnd, isActive } = req.body;
        try {
            const banner = await db_js_1.default.banner.create({
                data: {
                    imageUrl,
                    title,
                    targetUrl,
                    location,
                    scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
                    scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
                    isActive,
                },
            });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'BANNER_UPLOADED',
                ipAddress: req.ip,
                details: {
                    message: `Banner '${title || 'Untitled'}' uploaded by ${req.user.fullName}`,
                    bannerId: banner.id,
                    imageUrl,
                    location,
                    targetUrl,
                },
            });
            if (scheduledStart || scheduledEnd) {
                await (0, audit_js_1.createAuditLog)({
                    userId: req.user.id,
                    action: 'BANNER_SCHEDULED',
                    ipAddress: req.ip,
                    details: {
                        message: `Banner '${title || 'Untitled'}' scheduled from ${scheduledStart || 'N/A'} to ${scheduledEnd || 'N/A'} by ${req.user.fullName}`,
                        bannerId: banner.id,
                        scheduledStart,
                        scheduledEnd,
                    },
                });
            }
            return res.status(201).json({
                success: true,
                message: 'Banner created successfully',
                data: banner,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /admin/banners/:id (Admin Only)
     */
    static async updateBanner(req, res, next) {
        const { id } = req.params;
        const { imageUrl, title, targetUrl, location, scheduledStart, scheduledEnd, isActive } = req.body;
        try {
            const existing = await db_js_1.default.banner.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Banner not found' });
            }
            const banner = await db_js_1.default.banner.update({
                where: { id },
                data: {
                    imageUrl,
                    title,
                    targetUrl,
                    location,
                    scheduledStart: scheduledStart !== undefined ? (scheduledStart ? new Date(scheduledStart) : null) : undefined,
                    scheduledEnd: scheduledEnd !== undefined ? (scheduledEnd ? new Date(scheduledEnd) : null) : undefined,
                    isActive,
                },
            });
            if (scheduledStart !== undefined || scheduledEnd !== undefined) {
                await (0, audit_js_1.createAuditLog)({
                    userId: req.user.id,
                    action: 'BANNER_SCHEDULED',
                    ipAddress: req.ip,
                    details: {
                        message: `Banner '${banner.title || 'Untitled'}' scheduling updated by ${req.user.fullName}`,
                        bannerId: id,
                        scheduledStart,
                        scheduledEnd,
                    },
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Banner updated successfully',
                data: banner,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /admin/banners/:id (Admin Only)
     */
    static async deleteBanner(req, res, next) {
        const { id } = req.params;
        try {
            const existing = await db_js_1.default.banner.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Banner not found' });
            }
            await db_js_1.default.banner.delete({ where: { id } });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'BANNER_DELETED',
                ipAddress: req.ip,
                details: {
                    message: `Banner '${existing.title || 'Untitled'}' (ID: ${id}) deleted by ${req.user.fullName}`,
                    bannerId: id,
                    title: existing.title,
                },
            });
            return res.status(200).json({
                success: true,
                message: 'Banner deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BannerController = BannerController;
