"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCategoryController = exports.categoriesReorderSchema = exports.categoryUpdateSchema = exports.categoryCreateSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
const audit_js_1 = require("../utils/audit.js");
exports.categoryCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1),
        slug: zod_1.z.string().min(1),
        order: zod_1.z.coerce.number().int().default(0),
    }),
});
exports.categoryUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        slug: zod_1.z.string().min(1).optional(),
        order: zod_1.z.coerce.number().int().optional(),
    }),
});
exports.categoriesReorderSchema = zod_1.z.object({
    body: zod_1.z.object({
        categories: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string().uuid(),
            order: zod_1.z.coerce.number().int(),
        })).min(1),
    }),
});
class AdminCategoryController {
    /**
     * POST /admin/categories
     */
    static async createCategory(req, res, next) {
        const { name, slug, order } = req.body;
        try {
            const existing = await db_js_1.default.category.findFirst({
                where: { OR: [{ name }, { slug }] },
            });
            if (existing) {
                return res.status(409).json({ success: false, message: 'Category name or slug already exists' });
            }
            const category = await db_js_1.default.category.create({
                data: { name, slug, order },
            });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'CATEGORY_CREATED',
                ipAddress: req.ip,
                details: {
                    message: `Category '${name}' (Slug: ${slug}) created by ${req.user.fullName}`,
                    categoryId: category.id,
                    name,
                    slug,
                    order,
                },
            });
            return res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: category,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /admin/categories/:id
     */
    static async updateCategory(req, res, next) {
        const { id } = req.params;
        const { name, slug, order } = req.body;
        try {
            const existing = await db_js_1.default.category.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Category not found' });
            }
            const category = await db_js_1.default.category.update({
                where: { id },
                data: { name, slug, order },
            });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'CATEGORY_UPDATED',
                ipAddress: req.ip,
                details: {
                    message: `Category '${category.name}' updated by ${req.user.fullName}`,
                    categoryId: id,
                    name,
                    slug,
                    order,
                },
            });
            return res.status(200).json({
                success: true,
                message: 'Category updated successfully',
                data: category,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /admin/categories/:id
     */
    static async deleteCategory(req, res, next) {
        const { id } = req.params;
        try {
            const existing = await db_js_1.default.category.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Category not found' });
            }
            // Check for associated products
            const productCount = await db_js_1.default.product.count({ where: { categoryId: id } });
            if (productCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete category because it contains active products. Please delete or reassign products first.',
                });
            }
            await db_js_1.default.category.delete({ where: { id } });
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'CATEGORY_DELETED',
                ipAddress: req.ip,
                details: {
                    message: `Category '${existing.name}' deleted by ${req.user.fullName}`,
                    categoryId: id,
                    name: existing.name,
                },
            });
            return res.status(200).json({
                success: true,
                message: 'Category deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /admin/categories/reorder
     */
    static async reorderCategories(req, res, next) {
        const { categories } = req.body;
        try {
            await db_js_1.default.$transaction(categories.map((c) => db_js_1.default.category.update({
                where: { id: c.id },
                data: { order: c.order },
            })));
            return res.status(200).json({
                success: true,
                message: 'Categories reordered successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /categories
     */
    static async listCategories(req, res, next) {
        try {
            const categories = await db_js_1.default.category.findMany({
                orderBy: { order: 'asc' },
            });
            return res.status(200).json({
                success: true,
                data: categories,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminCategoryController = AdminCategoryController;
