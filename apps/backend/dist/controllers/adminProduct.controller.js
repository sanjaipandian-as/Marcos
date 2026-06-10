"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminProductController = exports.trendingToggleSchema = exports.productUpdateSchema = exports.productCreateSchema = void 0;
exports.computeStockStatus = computeStockStatus;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
exports.productCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1),
        description: zod_1.z.string().min(1),
        price: zod_1.z.coerce.number().positive(),
        materialInfo: zod_1.z.string().optional(),
        images: zod_1.z.array(zod_1.z.string()).default([]),
        categoryId: zod_1.z.string().uuid(),
        inventoryQty: zod_1.z.coerce.number().int().nonnegative().default(0),
    }),
});
exports.productUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().min(1).optional(),
        price: zod_1.z.coerce.number().positive().optional(),
        materialInfo: zod_1.z.string().optional(),
        images: zod_1.z.array(zod_1.z.string()).optional(),
        categoryId: zod_1.z.string().uuid().optional(),
        inventoryQty: zod_1.z.coerce.number().int().nonnegative().optional(),
    }),
});
exports.trendingToggleSchema = zod_1.z.object({
    body: zod_1.z.object({
        isTrending: zod_1.z.boolean(),
        trendingScheduledAt: zod_1.z.string().datetime().optional().nullable(),
    }),
});
function computeStockStatus(qty) {
    if (qty <= 0)
        return 'OUT_OF_STOCK';
    if (qty <= 10)
        return 'LOW_STOCK';
    return 'IN_STOCK';
}
class AdminProductController {
    /**
     * POST /admin/products
     */
    static async createProduct(req, res, next) {
        const { name, description, price, materialInfo, images, categoryId, inventoryQty } = req.body;
        try {
            // Verify category exists
            const categoryExists = await db_js_1.default.category.findUnique({ where: { id: categoryId } });
            if (!categoryExists) {
                return res.status(404).json({ success: false, message: 'Category not found' });
            }
            const stockStatus = computeStockStatus(inventoryQty);
            const product = await db_js_1.default.product.create({
                data: {
                    name,
                    description,
                    price,
                    materialInfo,
                    images,
                    categoryId,
                    inventoryQty,
                    stockStatus,
                },
            });
            // Write AuditLog
            await db_js_1.default.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PRODUCT_CREATED',
                    ipAddress: req.ip,
                    details: {
                        message: `Product ${name} created by ${req.user.fullName}`,
                        productId: product.id,
                        name,
                        price,
                        inventoryQty,
                    },
                },
            }).catch(err => console.error('Failed to write audit log:', err));
            return res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: product,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /admin/products/:id
     */
    static async updateProduct(req, res, next) {
        const { id } = req.params;
        const { name, description, price, materialInfo, images, categoryId, inventoryQty } = req.body;
        try {
            const existingProduct = await db_js_1.default.product.findUnique({ where: { id } });
            if (!existingProduct) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            const updateData = {
                name,
                description,
                price,
                materialInfo,
                images,
                categoryId,
                inventoryQty,
            };
            // Recalculate stockStatus if inventoryQty is provided
            if (inventoryQty !== undefined) {
                updateData.stockStatus = computeStockStatus(inventoryQty);
            }
            const product = await db_js_1.default.product.update({
                where: { id },
                data: updateData,
            });
            // Write AuditLog
            await db_js_1.default.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PRODUCT_UPDATED',
                    ipAddress: req.ip,
                    details: {
                        message: `Product ${product.name} updated by ${req.user.fullName}`,
                        productId: id,
                        updates: updateData,
                    },
                },
            }).catch(err => console.error('Failed to write audit log:', err));
            return res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                data: product,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /admin/products/:id
     */
    static async deleteProduct(req, res, next) {
        const { id } = req.params;
        try {
            const existingProduct = await db_js_1.default.product.findUnique({ where: { id } });
            if (!existingProduct) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            // Check for associated orders
            const orderCount = await db_js_1.default.orderItem.count({ where: { productId: id } });
            if (orderCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete product because it has associated orders. Consider setting inventoryQty to 0 instead.',
                });
            }
            await db_js_1.default.product.delete({ where: { id } });
            // Write AuditLog
            await db_js_1.default.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PRODUCT_DELETED',
                    ipAddress: req.ip,
                    details: {
                        message: `Product ${existingProduct.name} deleted by ${req.user.fullName}`,
                        productId: id,
                        name: existingProduct.name,
                    },
                },
            }).catch(err => console.error('Failed to write audit log:', err));
            return res.status(200).json({
                success: true,
                message: 'Product deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /admin/products/:id/trending
     */
    static async toggleTrending(req, res, next) {
        const { id } = req.params;
        const { isTrending, trendingScheduledAt } = req.body;
        try {
            const existingProduct = await db_js_1.default.product.findUnique({ where: { id } });
            if (!existingProduct) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            const product = await db_js_1.default.product.update({
                where: { id },
                data: {
                    isTrending,
                    trendingScheduledAt: trendingScheduledAt ? new Date(trendingScheduledAt) : null,
                },
            });
            // Write AuditLog
            await db_js_1.default.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'TOGGLE_TRENDING_PRODUCT',
                    details: {
                        message: `Product ${product.name} trending status set to ${isTrending} by ${req.user.fullName}`,
                        productId: id,
                        isTrending,
                    },
                },
            }).catch(err => console.error('Failed to write audit log:', err));
            return res.status(200).json({
                success: true,
                message: 'Product trending status updated successfully',
                data: product,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminProductController = AdminProductController;
