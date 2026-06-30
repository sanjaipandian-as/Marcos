import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { StockStatus } from '@prisma/client';
import redis from '../config/redis.js';

// Product query validation
export const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(1000).default(200),
    category: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['price', 'createdAt', 'name']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

// Cart item validator schema
export const cartAddSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1),
  }),
});

// Coupon validation schema
export const couponValidateSchema = z.object({
  body: z.object({
    code: z.string(),
  }),
});

// Favorite item validator schema
export const favoriteAddSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
  }),
});

export function computeStockStatus(qty: number): StockStatus {
  if (qty <= 0) return 'OUT_OF_STOCK';
  if (qty <= 10) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export class ProductController {
  /**
   * GET /products
   */
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    const { page, limit, category, search, sortBy, sortOrder } = req.query as any;
    const skip = (page - 1) * limit;
    const cacheKey = `cache:products:${JSON.stringify(req.query)}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }

      const where: any = {};
      
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

      const [products, total, activeOffers] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          include: { category: true },
        }),
        prisma.product.count({ where }),
        prisma.offer.findMany({
          where: { isActive: true },
        }),
      ]);

      const freeShippingProductIds = new Set<string>();
      const freeShippingCategoryIds = new Set<string>();
      let storewideFreeShipping = false;
      activeOffers.forEach(offer => {
        if (offer.isFreeShipping || offer.type === 'FREE_SHIPPING') {
          if (offer.applicableProductIds.length === 0 && offer.applicableCategoryIds.length === 0) {
            storewideFreeShipping = true;
          } else {
            offer.applicableProductIds.forEach(id => freeShippingProductIds.add(id));
            offer.applicableCategoryIds.forEach(id => freeShippingCategoryIds.add(id));
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
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      };

      await redis.set(cacheKey, JSON.stringify(responsePayload), 'EX', 120);

      return res.status(200).json(responsePayload);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /products/:id
   */
  static async getProductById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const [product, activeOffers] = await Promise.all([
        prisma.product.findUnique({
          where: { id },
          include: { category: true },
        }),
        prisma.offer.findMany({
          where: { isActive: true },
        })
      ]);

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      let hasFreeShipping = false;
      for (const offer of activeOffers) {
        if (offer.isFreeShipping || offer.type === 'FREE_SHIPPING') {
          if (
            (offer.applicableProductIds.length === 0 && offer.applicableCategoryIds.length === 0) ||
            offer.applicableProductIds.includes(product.id) ||
            offer.applicableCategoryIds.includes(product.categoryId)
          ) {
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
        await redis.rpush('analytics:events', JSON.stringify({
          eventType: 'PRODUCT_VIEW',
          productId: id,
          userId,
          createdAt: new Date().toISOString()
        }));
      } catch (e) {
        console.error('Failed to log product view event to Redis:', e);
      }

      return res.status(200).json({ success: true, data: processedProduct });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /cart
   */
  static async getCart(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
      const [items, activeOffers] = await Promise.all([
        prisma.cartItem.findMany({
          where: { userId },
          include: { product: true },
        }),
        prisma.offer.findMany({
          where: { isActive: true },
        })
      ]);

      const freeShippingProductIds = new Set<string>();
      const freeShippingCategoryIds = new Set<string>();
      let storewideFreeShipping = false;
      activeOffers.forEach(offer => {
        if (offer.isFreeShipping || offer.type === 'FREE_SHIPPING') {
          if (offer.applicableProductIds.length === 0 && offer.applicableCategoryIds.length === 0) {
            storewideFreeShipping = true;
          } else {
            offer.applicableProductIds.forEach(id => freeShippingProductIds.add(id));
            offer.applicableCategoryIds.forEach(id => freeShippingCategoryIds.add(id));
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /cart
   */
  static async addToCart(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { productId, quantity } = req.body;

    try {
      const product = await prisma.product.findUnique({ where: { id: productId } });
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

      const cartItem = await prisma.cartItem.upsert({
        where: {
          userId_productId: { userId, productId },
        },
        update: { quantity },
        create: { userId, productId, quantity },
      });

      // Log ADD_TO_CART event asynchronously to Redis list
      try {
        await redis.rpush('analytics:events', JSON.stringify({
          eventType: 'ADD_TO_CART',
          productId,
          userId,
          createdAt: new Date().toISOString()
        }));
      } catch (e) {
        console.error('Failed to log add to cart event to Redis:', e);
      }

      return res.status(200).json({ success: true, data: cartItem });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /cart/:productId
   */
  static async removeFromCart(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { productId } = req.params;

    try {
      await prisma.cartItem.delete({
        where: {
          userId_productId: { userId, productId },
        },
      });

      return res.status(200).json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
      next(error);
    }
  }


  /**
   * POST /cart/coupon
   */
  static async validateCoupon(req: Request, res: Response, next: NextFunction) {
    const { code } = req.body;

    try {
      const coupon = await prisma.coupon.findUnique({
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
        const userCouponExists = await prisma.userCoupon.findUnique({
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
        coupon: {
          code: coupon.code,
          discountPercent: coupon.discountPercent,
          discountFlat: coupon.discountFlat,
          maxDiscount: coupon.maxDiscount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /cart/favorites
   */
  static async getFavorites(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
      const items = await prisma.favorite.findMany({
        where: { userId },
        include: { product: true },
      });

      return res.status(200).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /cart/favorites
   */
  static async addToFavorites(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { productId } = req.body;

    try {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const favItem = await prisma.favorite.upsert({
        where: {
          userId_productId: { userId, productId },
        },
        update: {}, // Do nothing if already exists
        create: { userId, productId },
      });

      return res.status(200).json({ success: true, data: favItem });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /cart/favorites/:productId
   */
  static async removeFromFavorites(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { productId } = req.params;

    try {
      await prisma.favorite.delete({
        where: {
          userId_productId: { userId, productId },
        },
      });

      return res.status(200).json({ success: true, message: 'Item removed from favorites' });
    } catch (error) {
      next(error);
    }
  }
}
