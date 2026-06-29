import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
// Trigger IDE ts re-evaluation
import { createAuditLog } from '../utils/audit.js';

export const promoCreateSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    videoUrl: z.string().min(1),
    thumbnailUrl: z.string().optional().nullable(),
    linkType: z.enum(['PRODUCT', 'EXTERNAL', 'BOTH', 'NONE']).default('NONE'),
    productId: z.string().optional().nullable(),
    externalUrl: z.string().optional().nullable(),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
  }),
});

export const promoUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    videoUrl: z.string().min(1).optional(),
    thumbnailUrl: z.string().optional().nullable(),
    linkType: z.enum(['PRODUCT', 'EXTERNAL', 'BOTH', 'NONE']).optional(),
    productId: z.string().optional().nullable(),
    externalUrl: z.string().optional().nullable(),
    sortOrder: z.coerce.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

export class PromoContentController {
  /** Admin: List all promo content */
  static async listPromos(req: Request, res: Response, next: NextFunction) {
    try {
      const promos = await prisma.promoContent.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      res.json({ success: true, data: promos });
    } catch (error) {
      next(error);
    }
  }

  /** Admin: Create promo content */
  static async createPromo(req: Request, res: Response, next: NextFunction) {
    try {
      const promo = await prisma.promoContent.create({
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

      await createAuditLog({
        userId: (req as any).user?.id,
        action: 'PROMO_CREATED',
        ipAddress: req.ip,
        details: {
          message: `Promo '${promo.title}' created`,
          promoId: promo.id,
        },
      });

      res.status(201).json({ success: true, data: promo });
    } catch (error) {
      next(error);
    }
  }

  /** Admin: Update promo content */
  static async updatePromo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existing = await prisma.promoContent.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Promo content not found' });
      }

      const promo = await prisma.promoContent.update({
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

      await createAuditLog({
        userId: (req as any).user?.id,
        action: 'PROMO_UPDATED',
        ipAddress: req.ip,
        details: {
          message: `Promo '${promo.title}' updated`,
          promoId: promo.id,
        },
      });

      res.json({ success: true, data: promo });
    } catch (error) {
      next(error);
    }
  }

  /** Admin: Delete promo content */
  static async deletePromo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existing = await prisma.promoContent.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Promo content not found' });
      }

      await prisma.promoContent.delete({ where: { id } });

      await createAuditLog({
        userId: (req as any).user?.id,
        action: 'PROMO_DELETED',
        ipAddress: req.ip,
        details: {
          message: `Promo '${existing.title}' deleted`,
          promoId: id,
        },
      });

      res.json({ success: true, message: 'Promo content deleted' });
    } catch (error) {
      next(error);
    }
  }

  /** Public: Get active promo content for mobile app */
  static async getActivePromos(req: Request, res: Response, next: NextFunction) {
    try {
      const promos = await prisma.promoContent.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      res.json({ success: true, data: promos });
    } catch (error) {
      next(error);
    }
  }
}
