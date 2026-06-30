"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreLocationController = exports.storeLocationUpdateSchema = exports.storeLocationCreateSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
const audit_js_1 = require("../utils/audit.js");
exports.storeLocationCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1),
        address: zod_1.z.string().min(1),
        city: zod_1.z.string().min(1),
        state: zod_1.z.string().min(1),
        pincode: zod_1.z.string().min(1),
        country: zod_1.z.string().default('India'),
        phone: zod_1.z.string().optional().nullable(),
        email: zod_1.z.string().email().optional().nullable(),
        latitude: zod_1.z.coerce.number(),
        longitude: zod_1.z.coerce.number(),
        openingHours: zod_1.z.string().default('09:00'),
        closingHours: zod_1.z.string().default('21:00'),
        isActive: zod_1.z.boolean().default(true),
        description: zod_1.z.string().optional().nullable(),
        imageUrl: zod_1.z.string().optional().nullable(),
    }),
});
exports.storeLocationUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        address: zod_1.z.string().min(1).optional(),
        city: zod_1.z.string().min(1).optional(),
        state: zod_1.z.string().min(1).optional(),
        pincode: zod_1.z.string().min(1).optional(),
        country: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional().nullable(),
        email: zod_1.z.string().email().optional().nullable(),
        latitude: zod_1.z.coerce.number().optional(),
        longitude: zod_1.z.coerce.number().optional(),
        openingHours: zod_1.z.string().optional(),
        closingHours: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
        description: zod_1.z.string().optional().nullable(),
        imageUrl: zod_1.z.string().optional().nullable(),
    }),
});
class StoreLocationController {
    /**
     * GET /admin/stores
     */
    static async listStores(req, res, next) {
        try {
            const stores = await db_js_1.default.storeLocation.findMany({
                orderBy: { createdAt: 'desc' },
            });
            return res.status(200).json({
                success: true,
                data: stores,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /admin/stores
     */
    static async createStore(req, res, next) {
        const { name, address, city, state, pincode, country, phone, email, latitude, longitude, openingHours, closingHours, isActive, description, imageUrl, } = req.body;
        try {
            const store = await db_js_1.default.storeLocation.create({
                data: {
                    name, address, city, state, pincode, country,
                    phone, email, latitude, longitude,
                    openingHours, closingHours, isActive, description, imageUrl,
                },
            });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'STORE_CREATED',
                ipAddress: req.ip,
                details: {
                    message: `Store '${name}' in ${city}, ${state} created by ${req.user.fullName}`,
                    storeId: store.id,
                    city,
                    state,
                },
            });
            return res.status(201).json({
                success: true,
                message: 'Store location created successfully',
                data: store,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /admin/stores/:id
     */
    static async updateStore(req, res, next) {
        const { id } = req.params;
        try {
            const existing = await db_js_1.default.storeLocation.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Store not found' });
            }
            const store = await db_js_1.default.storeLocation.update({
                where: { id },
                data: req.body,
            });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'STORE_UPDATED',
                ipAddress: req.ip,
                details: {
                    message: `Store '${store.name}' updated by ${req.user.fullName}`,
                    storeId: id,
                },
            });
            return res.status(200).json({
                success: true,
                message: 'Store location updated successfully',
                data: store,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /admin/stores/:id
     */
    static async deleteStore(req, res, next) {
        const { id } = req.params;
        try {
            const existing = await db_js_1.default.storeLocation.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Store not found' });
            }
            await db_js_1.default.storeLocation.delete({ where: { id } });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'STORE_DELETED',
                ipAddress: req.ip,
                details: {
                    message: `Store '${existing.name}' deleted by ${req.user.fullName}`,
                    storeId: id,
                },
            });
            return res.status(200).json({
                success: true,
                message: 'Store location deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /stores  (Public — for mobile app)
     */
    static async getPublicStores(req, res, next) {
        try {
            const stores = await db_js_1.default.storeLocation.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            });
            return res.status(200).json({
                success: true,
                data: stores,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StoreLocationController = StoreLocationController;
