"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = exports.couponValidateSchema = exports.cartAddSchema = exports.productQuerySchema = void 0;
exports.computeStockStatus = computeStockStatus;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
// Product query validation
exports.productQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
        category: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['price', 'createdAt', 'name']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    }),
});
// Cart item validator schema
exports.cartAddSchema = zod_1.z.object({
    body: zod_1.z.object({
        productId: zod_1.z.string().uuid(),
        quantity: zod_1.z.coerce.number().int().min(1),
    }),
});
// Coupon validation schema
exports.couponValidateSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string(),
    }),
});
function computeStockStatus(qty) {
    if (qty <= 0)
        return 'OUT_OF_STOCK';
    if (qty <= 10)
        return 'LOW_STOCK';
    return 'IN_STOCK';
}
class ProductController {
    /**
     * GET /products
     */
    static async getProducts(req, res, next) {
        const { page, limit, category, search, sortBy, sortOrder } = req.query;
        const skip = (page - 1) * limit;
        try {
            const where = {};
            if (category) {
                where.category = {
                    slug: category,
                };
            }
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ];
            }
            const [products, total] = await Promise.all([
                db_js_1.default.product.findMany({
                    where,
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                    include: { category: true },
                }),
                db_js_1.default.product.count({ where }),
            ]);
            return res.status(200).json({
                success: true,
                data: products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /products/:id
     */
    static async getProductById(req, res, next) {
        const { id } = req.params;
        try {
            const product = await db_js_1.default.product.findUnique({
                where: { id },
                include: { category: true },
            });
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            return res.status(200).json({ success: true, data: product });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /cart
     */
    static async getCart(req, res, next) {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        try {
            const items = await db_js_1.default.cartItem.findMany({
                where: { userId },
                include: { product: true },
            });
            return res.status(200).json({ success: true, data: items });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /cart
     */
    static async addToCart(req, res, next) {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { productId, quantity } = req.body;
        try {
            const product = await db_js_1.default.product.findUnique({ where: { id: productId } });
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            // Check inventory quantity
            if (product.inventoryQty < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient inventory. Only ${product.inventoryQty} items remaining in stock.`,
                });
            }
            const cartItem = await db_js_1.default.cartItem.upsert({
                where: {
                    userId_productId: { userId, productId },
                },
                update: { quantity },
                create: { userId, productId, quantity },
            });
            return res.status(200).json({ success: true, data: cartItem });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /cart/:productId
     */
    static async removeFromCart(req, res, next) {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { productId } = req.params;
        try {
            await db_js_1.default.cartItem.delete({
                where: {
                    userId_productId: { userId, productId },
                },
            });
            return res.status(200).json({ success: true, message: 'Item removed from cart' });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /cart/coupon
     */
    static async validateCoupon(req, res, next) {
        const { code } = req.body;
        try {
            const coupon = await db_js_1.default.coupon.findUnique({
                where: { code: code.toUpperCase() },
            });
            if (!coupon) {
                return res.status(404).json({ success: false, message: 'Coupon invalid or not found' });
            }
            if (!coupon.isActive) {
                return res.status(400).json({ success: false, message: 'Coupon is currently inactive' });
            }
            if (new Date() > new Date(coupon.expiryDate)) {
                return res.status(400).json({ success: false, message: 'Coupon has expired' });
            }
            if (coupon.usedCount >= coupon.maxUses) {
                return res.status(400).json({ success: false, message: 'Coupon utilization limit reached' });
            }
            // Return coupon calculations
            return res.status(200).json({
                success: true,
                message: 'Coupon is valid',
                coupon: {
                    code: coupon.code,
                    discountPercent: coupon.discountPercent,
                    discountFlat: coupon.discountFlat,
                    maxDiscount: coupon.maxDiscount,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
