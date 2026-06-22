"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannerController = exports.bannerUpdateSchema = exports.bannerCreateSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
const audit_js_1 = require("../utils/audit.js");
const redis_js_1 = __importDefault(require("../config/redis.js"));
async function invalidateBannerCache() {
    try {
        await redis_js_1.default.del('cache:banners:all', 'cache:banners:loc:HOME_SLIDER', 'cache:banners:loc:PROMOTIONAL_SECTION', 'cache:banners:loc:OFFER_SECTION');
    }
    catch (err) {
        console.error('Failed to invalidate banner cache:', err);
    }
}
exports.bannerCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        imageUrl: zod_1.z.string().url(),
        title: zod_1.z.string().optional().nullable(),
        targetUrl: zod_1.z.string().optional().nullable(),
        location: zod_1.z.enum(['HOME_SLIDER', 'PROMOTIONAL_SECTION', 'OFFER_SECTION']),
        scheduledStart: zod_1.z.string().datetime().optional().nullable(),
        scheduledEnd: zod_1.z.string().datetime().optional().nullable(),
        isActive: zod_1.z.boolean().default(true),
        order: zod_1.z.number().int().default(0),
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
        order: zod_1.z.number().int().optional(),
    }),
});
class BannerController {
    /**
     * GET /banners
     * Public: returns active banners. If filters are provided, applies them.
     */
    static async getBanners(req, res, next) {
        const { location } = req.query;
        const cacheKey = location ? `cache:banners:loc:${location}` : 'cache:banners:all';
        try {
            const cached = await redis_js_1.default.get(cacheKey);
            if (cached) {
                return res.status(200).json({
                    success: true,
                    data: JSON.parse(cached),
                });
            }
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
                orderBy: [
                    { order: 'asc' },
                    { createdAt: 'asc' }
                ],
            });
            await redis_js_1.default.set(cacheKey, JSON.stringify(banners), 'EX', 86400);
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
                orderBy: [
                    { order: 'asc' },
                    { createdAt: 'asc' }
                ],
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
            if (error.code === 'P2025') {
                return res.status(404).json({ success: false, message: 'Banner not found' });
            }
            next(error);
        }
    }
    /**
     * POST /admin/banners (Admin Only)
     */
    static async createBanner(req, res, next) {
        const { imageUrl, title, targetUrl, location, scheduledStart, scheduledEnd, isActive, order } = req.body;
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
                    order: order !== undefined ? order : 0,
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
            await invalidateBannerCache();
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
        const { imageUrl, title, targetUrl, location, scheduledStart, scheduledEnd, isActive, order } = req.body;
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
                    order: order !== undefined ? order : undefined,
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
            await invalidateBannerCache();
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
            await invalidateBannerCache();
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
