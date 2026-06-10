import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { StockStatus } from '@prisma/client';

// Product query validation
export const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
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

    try {
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

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          include: { category: true },
        }),
        prisma.product.count({ where }),
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
      const product = await prisma.product.findUnique({
        where: { id },
        include: { category: true },
      });

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      return res.status(200).json({ success: true, data: product });
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
      const items = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });

      return res.status(200).json({ success: true, data: items });
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
