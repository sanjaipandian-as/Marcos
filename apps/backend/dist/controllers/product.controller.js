"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = exports.favoriteAddSchema = exports.couponValidateSchema = exports.cartAddSchema = exports.productQuerySchema = void 0;
exports.computeStockStatus = computeStockStatus;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
const redis_js_1 = __importDefault(require("../config/redis.js"));
// Capped in-memory LRU-like cache for search variations (stores up to 200 unique queries)
const searchVariationsCache = new Map();
const MAX_CACHE_SIZE = 200;
function cacheSearchVariations(query, variations) {
    if (searchVariationsCache.size >= MAX_CACHE_SIZE) {
        const firstKey = searchVariationsCache.keys().next().value;
        if (firstKey)
            searchVariationsCache.delete(firstKey);
    }
    searchVariationsCache.set(query, variations);
}
// Helper to generate search variations for singular and plural matching
function getSearchVariations(query) {
    if (!query)
        return [];
    const trimmed = query.trim();
    if (trimmed === '')
        return [];
    // Check cache first
    if (searchVariationsCache.has(trimmed)) {
        return searchVariationsCache.get(trimmed);
    }
    const variations = new Set();
    variations.add(trimmed);
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length === 0)
        return [];
    // Word count cap: skip combinatorial expansion for complex multi-word queries (e.g. > 3 words)
    // to avoid combinatorial blowup and keep database clauses clean.
    if (words.length > 3) {
        const result = Array.from(variations);
        cacheSearchVariations(trimmed, result);
        return result;
    }
    // Singular nouns that end in s/ss and shouldn't be stripped of their ending s/ss
    const singularEndsWithS = new Set([
        'dress', 'jeans', 'glass', 'canvas', 'business', 'trousers', 'pants', 'tuxedo', 'suits'
    ]);
    // Irregular singular <-> plural mapping for clothing/catalog items
    const irregularPlurals = {
        scarf: 'scarves',
        scarves: 'scarf',
        half: 'halves',
        halves: 'half',
        shelf: 'shelves',
        shelves: 'shelf',
        foot: 'feet',
        feet: 'foot'
    };
    const wordVariationsList = words.map(word => {
        const wordVars = new Set();
        wordVars.add(word);
        const lowerWord = word.toLowerCase();
        // Guard 1: Irregular Plurals
        if (irregularPlurals[lowerWord]) {
            wordVars.add(irregularPlurals[lowerWord]);
            return Array.from(wordVars);
        }
        // Guard 2: Singular nouns ending in s/ss
        if (singularEndsWithS.has(lowerWord)) {
            if (lowerWord === 'dress') {
                wordVars.add('dresses');
            }
            else if (lowerWord === 'glass') {
                wordVars.add('glasses');
            }
            else if (lowerWord === 'jeans') {
                wordVars.add('jean');
            }
            return Array.from(wordVars);
        }
        // Plural to singular rules
        if (lowerWord.endsWith('s')) {
            if (lowerWord.endsWith('ies') && lowerWord.length > 3) {
                // accessories -> accessory
                wordVars.add(word.slice(0, -3) + 'y');
            }
            else if ((lowerWord.endsWith('sses') ||
                lowerWord.endsWith('ches') ||
                lowerWord.endsWith('shes') ||
                lowerWord.endsWith('xes')) && lowerWord.length > 4) {
                // dresses -> dress, trenches -> trench, boxes -> box
                wordVars.add(word.slice(0, -2));
            }
            else {
                // shirts -> shirt, sarees -> saree (strip last s)
                wordVars.add(word.slice(0, -1));
            }
        }
        else {
            // Singular to plural rules
            if (lowerWord.endsWith('y') && lowerWord.length > 1) {
                // accessory -> accessories
                wordVars.add(word.slice(0, -1) + 'ies');
            }
            else if (lowerWord.endsWith('ch') ||
                lowerWord.endsWith('sh') ||
                lowerWord.endsWith('x') ||
                lowerWord.endsWith('s')) {
                wordVars.add(word + 'es');
            }
            else {
                // shirt -> shirts, suit -> suits
                wordVars.add(word + 's');
            }
        }
        return Array.from(wordVars);
    });
    const combine = (index, current) => {
        if (index === wordVariationsList.length) {
            variations.add(current.trim());
            return;
        }
        for (const v of wordVariationsList[index]) {
            combine(index + 1, current + " " + v);
        }
    };
    combine(0, "");
    const result = Array.from(variations);
    cacheSearchVariations(trimmed, result);
    return result;
}
// Product query validation
exports.productQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(1000).default(200),
        category: zod_1.z.string().optional(),
        categoryId: zod_1.z.string().optional(),
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
// Favorite item validator schema
exports.favoriteAddSchema = zod_1.z.object({
    body: zod_1.z.object({
        productId: zod_1.z.string().uuid(),
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
     * Helper to fetch and cache active offers
     */
    static async getActiveOffers() {
        const cacheKey = 'cache:active_offers';
        const cached = await redis_js_1.default.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const offers = await db_js_1.default.offer.findMany({ where: { isActive: true } });
        await redis_js_1.default.set(cacheKey, JSON.stringify(offers), 'EX', 300); // 5 minutes
        return offers;
    }
    /**
     * Helper to fetch and cache all categories for hierarchy traversal
     */
    static async getAllCategoriesCached() {
        const cacheKey = 'cache:all_categories_tree';
        const cached = await redis_js_1.default.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const categories = await db_js_1.default.category.findMany();
        await redis_js_1.default.set(cacheKey, JSON.stringify(categories), 'EX', 300); // 5 minutes
        return categories;
    }
    /**
     * GET /products
     */
    static async getProducts(req, res, next) {
        const { page, limit, category, categoryId, search, sortBy, sortOrder } = req.query;
        const safePage = Math.max(parseInt(page, 10) || 1, 1);
        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (safePage - 1) * safeLimit;
        const sortField = (sortBy && typeof sortBy === 'string') ? sortBy : 'createdAt';
        const sortDir = (sortOrder === 'asc' || sortOrder === 'desc') ? sortOrder : 'desc';
        const cacheKey = `cache:products:page-${safePage}-limit-${safeLimit}-cat-${category || 'all'}-catId-${categoryId || 'all'}-search-${search || 'none'}-sort-${sortField}-${sortDir}`;
        try {
            const cached = await redis_js_1.default.get(cacheKey);
            if (cached) {
                res.setHeader('X-Cache', 'HIT');
                return res.status(200).json(JSON.parse(cached));
            }
            res.setHeader('X-Cache', 'MISS');
            const where = {};
            if (category) {
                const allCategories = await ProductController.getAllCategoriesCached();
                const targetCategory = allCategories.find((c) => c.slug === category);
                if (targetCategory) {
                    const getDescendants = (parentId) => {
                        const list = [parentId];
                        allCategories.forEach((c) => {
                            if (c.parentId === parentId) {
                                list.push(...getDescendants(c.id));
                            }
                        });
                        return list;
                    };
                    const descendantIds = getDescendants(targetCategory.id);
                    where.categoryId = { in: descendantIds };
                }
                else {
                    where.category = {
                        slug: category,
                    };
                }
            }
            else if (categoryId) {
                const allCategories = await ProductController.getAllCategoriesCached();
                const getDescendants = (parentId) => {
                    const list = [parentId];
                    allCategories.forEach((c) => {
                        if (c.parentId === parentId) {
                            list.push(...getDescendants(c.id));
                        }
                    });
                    return list;
                };
                const descendantIds = getDescendants(categoryId);
                where.categoryId = { in: descendantIds };
            }
            if (search) {
                const variations = getSearchVariations(search);
                const orConditions = [];
                variations.forEach(term => {
                    orConditions.push({ name: { contains: term, mode: 'insensitive' } });
                    orConditions.push({ description: { contains: term, mode: 'insensitive' } });
                });
                where.OR = orConditions;
            }
            const [products, total] = await Promise.all([
                db_js_1.default.product.findMany({
                    where,
                    orderBy: { [sortField]: sortDir },
                    skip,
                    take: safeLimit,
                    include: { category: true },
                }),
                db_js_1.default.product.count({ where }),
            ]);
            const activeOffers = await ProductController.getActiveOffers();
            const freeShippingProductIds = new Set();
            const freeShippingCategoryIds = new Set();
            let storewideFreeShipping = false;
            activeOffers.forEach((offer) => {
                if (offer.isFreeShipping || offer.type === 'FREE_SHIPPING') {
                    if (offer.applicableProductIds.length === 0 && offer.applicableCategoryIds.length === 0) {
                        storewideFreeShipping = true;
                    }
                    else {
                        offer.applicableProductIds.forEach((id) => freeShippingProductIds.add(id));
                        offer.applicableCategoryIds.forEach((id) => freeShippingCategoryIds.add(id));
                    }
                }
            });
            const processedProducts = products.map(product => ({
                ...product,
                hasFreeShipping: storewideFreeShipping || freeShippingProductIds.has(product.id) || freeShippingCategoryIds.has(product.categoryId)
            }));
            const responsePayload = {
                success: true,
                data: processedProducts,
                pagination: {
                    page: safePage,
                    limit: safeLimit,
                    total,
                    pages: Math.ceil(total / safeLimit) || 1,
                },
            };
            await redis_js_1.default.set(cacheKey, JSON.stringify(responsePayload), 'EX', 300); // 5 minutes cache
            return res.status(200).json(responsePayload);
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
            const activeOffers = await ProductController.getActiveOffers();
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            let hasFreeShipping = false;
            for (const offer of activeOffers) {
                if (offer.isFreeShipping || offer.type === 'FREE_SHIPPING') {
                    if ((offer.applicableProductIds.length === 0 && offer.applicableCategoryIds.length === 0) ||
                        offer.applicableProductIds.includes(product.id) ||
                        offer.applicableCategoryIds.includes(product.categoryId)) {
                        hasFreeShipping = true;
                        break;
                    }
                }
            }
            const processedProduct = {
                ...product,
                hasFreeShipping
            };
            // Log PRODUCT_VIEW event asynchronously to Redis list
            const userId = req.user?.id || null;
            try {
                await redis_js_1.default.rpush('analytics:events', JSON.stringify({
                    eventType: 'PRODUCT_VIEW',
                    productId: id,
                    userId,
                    createdAt: new Date().toISOString()
                }));
            }
            catch (e) {
                console.error('Failed to log product view event to Redis:', e);
            }
            return res.status(200).json({ success: true, data: processedProduct });
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
            const activeOffers = await ProductController.getActiveOffers();
            const freeShippingProductIds = new Set();
            const freeShippingCategoryIds = new Set();
            let storewideFreeShipping = false;
            activeOffers.forEach((offer) => {
                if (offer.isFreeShipping || offer.type === 'FREE_SHIPPING') {
                    if (offer.applicableProductIds.length === 0 && offer.applicableCategoryIds.length === 0) {
                        storewideFreeShipping = true;
                    }
                    else {
                        offer.applicableProductIds.forEach((id) => freeShippingProductIds.add(id));
                        offer.applicableCategoryIds.forEach((id) => freeShippingCategoryIds.add(id));
                    }
                }
            });
            const processedItems = items.map(item => ({
                ...item,
                product: {
                    ...item.product,
                    hasFreeShipping: storewideFreeShipping || freeShippingProductIds.has(item.product.id) || freeShippingCategoryIds.has(item.product.categoryId)
                }
            }));
            return res.status(200).json({ success: true, data: processedItems });
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
            // Log ADD_TO_CART event asynchronously to Redis list
            try {
                await redis_js_1.default.rpush('analytics:events', JSON.stringify({
                    eventType: 'ADD_TO_CART',
                    productId,
                    userId,
                    createdAt: new Date().toISOString()
                }));
            }
            catch (e) {
                console.error('Failed to log add to cart event to Redis:', e);
            }
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
            // Check if this user has already used this coupon
            const userId = req.user?.id;
            if (userId) {
                const userCouponExists = await db_js_1.default.userCoupon.findUnique({
                    where: {
                        userId_couponId: { userId, couponId: coupon.id },
                    },
                });
                if (userCouponExists) {
                    return res.status(400).json({ success: false, message: 'You have already used this coupon' });
                }
            }
            // Return coupon calculations
            return res.status(200).json({
                success: true,
                message: 'Coupon is valid',
                data: {
                    code: coupon.code,
                    discountPercent: coupon.discountPercent,
                    discountFlat: coupon.discountFlat,
                    maxDiscount: coupon.maxDiscount,
                },
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
    /**
     * GET /cart/favorites
     */
    static async getFavorites(req, res, next) {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        try {
            const items = await db_js_1.default.favorite.findMany({
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
     * POST /cart/favorites
     */
    static async addToFavorites(req, res, next) {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { productId } = req.body;
        try {
            const product = await db_js_1.default.product.findUnique({ where: { id: productId } });
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            const favItem = await db_js_1.default.favorite.upsert({
                where: {
                    userId_productId: { userId, productId },
                },
                update: {}, // Do nothing if already exists
                create: { userId, productId },
            });
            return res.status(200).json({ success: true, data: favItem });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /cart/favorites/:productId
     */
    static async removeFromFavorites(req, res, next) {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { productId } = req.params;
        try {
            await db_js_1.default.favorite.delete({
                where: {
                    userId_productId: { userId, productId },
                },
            });
            return res.status(200).json({ success: true, message: 'Item removed from favorites' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
