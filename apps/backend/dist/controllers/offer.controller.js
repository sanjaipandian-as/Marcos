"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferController = exports.offerUpdateSchema = exports.offerCreateSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
// Trigger IDE ts re-evaluation
const audit_js_1 = require("../utils/audit.js");
exports.offerCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        type: zod_1.z.enum(['PERCENTAGE', 'FLAT', 'FREE_SHIPPING', 'NONE']),
        isFreeShipping: zod_1.z.boolean().default(false),
        discountValue: zod_1.z.coerce.number().nonnegative().default(0),
        minOrderAmount: zod_1.z.coerce.number().nonnegative().default(0),
        maxDiscount: zod_1.z.coerce.number().nonnegative().optional().nullable(),
        applicableProductIds: zod_1.z.array(zod_1.z.string()).default([]),
        applicableCategoryIds: zod_1.z.array(zod_1.z.string()).default([]),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
        isActive: zod_1.z.boolean().default(true),
    }),
});
exports.offerUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional().nullable(),
        type: zod_1.z.enum(['PERCENTAGE', 'FLAT', 'FREE_SHIPPING', 'NONE']).optional(),
        isFreeShipping: zod_1.z.boolean().optional(),
        discountValue: zod_1.z.coerce.number().nonnegative().optional(),
        minOrderAmount: zod_1.z.coerce.number().nonnegative().optional(),
        maxDiscount: zod_1.z.coerce.number().nonnegative().optional().nullable(),
        applicableProductIds: zod_1.z.array(zod_1.z.string()).optional(),
        applicableCategoryIds: zod_1.z.array(zod_1.z.string()).optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
class OfferController {
    /**
     * GET /admin/offers
     */
    static async listOffers(req, res, next) {
        try {
            const offers = await db_js_1.default.offer.findMany({
                orderBy: { createdAt: 'desc' },
            });
            return res.status(200).json({
                success: true,
                data: offers,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /admin/offers
     */
    static async createOffer(req, res, next) {
        const { title, description, type, isFreeShipping, discountValue, minOrderAmount, maxDiscount, applicableProductIds, applicableCategoryIds, startDate, endDate, isActive, } = req.body;
        try {
            const offer = await db_js_1.default.offer.create({
                data: {
                    title,
                    description,
                    type,
                    isFreeShipping,
                    discountValue,
                    minOrderAmount,
                    maxDiscount,
                    applicableProductIds,
                    applicableCategoryIds,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    isActive,
                },
            });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'OFFER_CREATED',
                ipAddress: req.ip,
                details: {
                    message: `Offer '${title}' (${type}) created by ${req.user.fullName}`,
                    offerId: offer.id,
                    type,
                    discountValue,
                },
            });
            return res.status(201).json({
                success: true,
                message: 'Offer created successfully',
                data: offer,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /admin/offers/:id
     */
    static async updateOffer(req, res, next) {
        const { id } = req.params;
        try {
            const existing = await db_js_1.default.offer.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Offer not found' });
            }
            const updateData = { ...req.body };
            if (updateData.startDate)
                updateData.startDate = new Date(updateData.startDate);
            if (updateData.endDate)
                updateData.endDate = new Date(updateData.endDate);
            const offer = await db_js_1.default.offer.update({
                where: { id },
                data: updateData,
            });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'OFFER_UPDATED',
                ipAddress: req.ip,
                details: {
                    message: `Offer '${offer.title}' updated by ${req.user.fullName}`,
                    offerId: id,
                },
            });
            return res.status(200).json({
                success: true,
                message: 'Offer updated successfully',
                data: offer,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /admin/offers/:id
     */
    static async deleteOffer(req, res, next) {
        const { id } = req.params;
        try {
            const existing = await db_js_1.default.offer.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Offer not found' });
            }
            await db_js_1.default.offer.delete({ where: { id } });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'OFFER_DELETED',
                ipAddress: req.ip,
                details: {
                    message: `Offer '${existing.title}' deleted by ${req.user.fullName}`,
                    offerId: id,
                },
            });
            return res.status(200).json({
                success: true,
                message: 'Offer deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /offers/active  (Public — for mobile app)
     */
    static async getActiveOffers(req, res, next) {
        try {
            const now = new Date();
            const offers = await db_js_1.default.offer.findMany({
                where: {
                    isActive: true,
                    startDate: { lte: now },
                    endDate: { gte: now },
                },
                orderBy: { createdAt: 'desc' },
            });
            return res.status(200).json({
                success: true,
                data: offers,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OfferController = OfferController;
