"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoContentController = exports.promoUpdateSchema = exports.promoCreateSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
// Trigger IDE ts re-evaluation
const audit_js_1 = require("../utils/audit.js");
exports.promoCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1),
        description: zod_1.z.string().optional().nullable(),
        videoUrl: zod_1.z.string().min(1),
        thumbnailUrl: zod_1.z.string().optional().nullable(),
        linkType: zod_1.z.enum(['PRODUCT', 'EXTERNAL', 'BOTH', 'NONE']).default('NONE'),
        productId: zod_1.z.string().optional().nullable(),
        externalUrl: zod_1.z.string().optional().nullable(),
        sortOrder: zod_1.z.coerce.number().int().default(0),
        isActive: zod_1.z.boolean().default(true),
    }),
});
exports.promoUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional().nullable(),
        videoUrl: zod_1.z.string().min(1).optional(),
        thumbnailUrl: zod_1.z.string().optional().nullable(),
        linkType: zod_1.z.enum(['PRODUCT', 'EXTERNAL', 'BOTH', 'NONE']).optional(),
        productId: zod_1.z.string().optional().nullable(),
        externalUrl: zod_1.z.string().optional().nullable(),
        sortOrder: zod_1.z.coerce.number().int().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
class PromoContentController {
    /** Admin: List all promo content */
    static async listPromos(req, res, next) {
        try {
            const promos = await db_js_1.default.promoContent.findMany({
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            });
            res.json({ success: true, data: promos });
        }
        catch (error) {
            next(error);
        }
    }
    /** Admin: Create promo content */
    static async createPromo(req, res, next) {
        try {
            const promo = await db_js_1.default.promoContent.create({
                data: {
                    title: req.body.title,
                    description: req.body.description || null,
                    videoUrl: req.body.videoUrl,
                    thumbnailUrl: req.body.thumbnailUrl || null,
                    linkType: req.body.linkType || 'NONE',
                    productId: req.body.productId || null,
                    externalUrl: req.body.externalUrl || null,
                    sortOrder: req.body.sortOrder ?? 0,
                    isActive: req.body.isActive ?? true,
                },
            });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user?.id,
                action: 'PROMO_CREATED',
                ipAddress: req.ip,
                details: {
                    message: `Promo '${promo.title}' created`,
                    promoId: promo.id,
                },
            });
            res.status(201).json({ success: true, data: promo });
        }
        catch (error) {
            next(error);
        }
    }
    /** Admin: Update promo content */
    static async updatePromo(req, res, next) {
        try {
            const { id } = req.params;
            const existing = await db_js_1.default.promoContent.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Promo content not found' });
            }
            const promo = await db_js_1.default.promoContent.update({
                where: { id },
                data: {
                    ...(req.body.title !== undefined && { title: req.body.title }),
                    ...(req.body.description !== undefined && { description: req.body.description }),
                    ...(req.body.videoUrl !== undefined && { videoUrl: req.body.videoUrl }),
                    ...(req.body.thumbnailUrl !== undefined && { thumbnailUrl: req.body.thumbnailUrl }),
                    ...(req.body.linkType !== undefined && { linkType: req.body.linkType }),
                    ...(req.body.productId !== undefined && { productId: req.body.productId }),
                    ...(req.body.externalUrl !== undefined && { externalUrl: req.body.externalUrl }),
                    ...(req.body.sortOrder !== undefined && { sortOrder: req.body.sortOrder }),
                    ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
                },
            });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user?.id,
                action: 'PROMO_UPDATED',
                ipAddress: req.ip,
                details: {
                    message: `Promo '${promo.title}' updated`,
                    promoId: promo.id,
                },
            });
            res.json({ success: true, data: promo });
        }
        catch (error) {
            next(error);
        }
    }
    /** Admin: Delete promo content */
    static async deletePromo(req, res, next) {
        try {
            const { id } = req.params;
            const existing = await db_js_1.default.promoContent.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Promo content not found' });
            }
            await db_js_1.default.promoContent.delete({ where: { id } });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user?.id,
                action: 'PROMO_DELETED',
                ipAddress: req.ip,
                details: {
                    message: `Promo '${existing.title}' deleted`,
                    promoId: id,
                },
            });
            res.json({ success: true, message: 'Promo content deleted' });
        }
        catch (error) {
            next(error);
        }
    }
    /** Public: Get active promo content for mobile app */
    static async getActivePromos(req, res, next) {
        try {
            const promos = await db_js_1.default.promoContent.findMany({
                where: { isActive: true },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            });
            res.json({ success: true, data: promos });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PromoContentController = PromoContentController;
