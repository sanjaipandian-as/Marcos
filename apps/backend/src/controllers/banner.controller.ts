import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { createAuditLog } from '../utils/audit.js';
import redis from '../config/redis.js';

async function invalidateBannerCache() {
  try {
    await redis.del('cache:banners:all', 'cache:banners:loc:HOME_SLIDER', 'cache:banners:loc:PROMOTIONAL_SECTION', 'cache:banners:loc:OFFER_SECTION');
  } catch (err) {
    console.error('Failed to invalidate banner cache:', err);
  }
}

export const bannerCreateSchema = z.object({
  body: z.object({
    imageUrl: z.string().url(),
    title: z.string().optional().nullable(),
    targetUrl: z.string().optional().nullable(),
    location: z.enum(['HOME_SLIDER', 'PROMOTIONAL_SECTION', 'OFFER_SECTION']),
    scheduledStart: z.string().datetime().optional().nullable(),
    scheduledEnd: z.string().datetime().optional().nullable(),
    isActive: z.boolean().default(true),
    order: z.number().int().default(0),
  }),
});

export const bannerUpdateSchema = z.object({
  body: z.object({
    imageUrl: z.string().url().optional(),
    title: z.string().optional().nullable(),
    targetUrl: z.string().optional().nullable(),
    location: z.enum(['HOME_SLIDER', 'PROMOTIONAL_SECTION', 'OFFER_SECTION']).optional(),
    scheduledStart: z.string().datetime().optional().nullable(),
    scheduledEnd: z.string().datetime().optional().nullable(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

export class BannerController {
  /**
   * GET /banners
   * Public: returns active banners. If filters are provided, applies them.
   */
  static async getBanners(req: Request, res: Response, next: NextFunction) {
    const { location } = req.query;
    const cacheKey = location ? `cache:banners:loc:${location}` : 'cache:banners:all';

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          success: true,
          data: JSON.parse(cached),
        });
      }

      const now = new Date();
      const where: any = {
        isActive: true,
        OR: [
          { scheduledStart: null, scheduledEnd: null },
          {
            scheduledStart: { lte: now },
            scheduledEnd: { gte: now },
          },
        ],
      };

      if (location) {
        where.location = location;
      }

      const banners = await prisma.banner.findMany({
        where,
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' }
        ],
      });

      await redis.set(cacheKey, JSON.stringify(banners), 'EX', 86400);

      return res.status(200).json({
        success: true,
        data: banners,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /banners/admin (Admin / Staff Only)
   */
  static async adminListBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await prisma.banner.findMany({
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' }
        ],
      });

      return res.status(200).json({
        success: true,
        data: banners,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /banners/:id/click
   * Public: Increments banner click analytics
   */
  static async incrementClicks(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      await prisma.banner.update({
        where: { id },
        data: { clicks: { increment: 1 } },
      });

      return res.status(200).json({
        success: true,
        message: 'Click registered successfully',
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }
      next(error);
    }
  }

  /**
   * POST /admin/banners (Admin Only)
   */
  static async createBanner(req: Request, res: Response, next: NextFunction) {
    const { imageUrl, title, targetUrl, location, scheduledStart, scheduledEnd, isActive, order } = req.body;

    try {
      const banner = await prisma.banner.create({
        data: {
          imageUrl,
          title,
          targetUrl,
          location,
          scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
          scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
          isActive,
          order: order !== undefined ? order : 0,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'BANNER_UPLOADED',
        ipAddress: req.ip,
        details: {
          message: `Banner '${title || 'Untitled'}' uploaded by ${req.user!.fullName}`,
          bannerId: banner.id,
          imageUrl,
          location,
          targetUrl,
        },
      });

      if (scheduledStart || scheduledEnd) {
        await createAuditLog({
          userId: req.user!.id,
          action: 'BANNER_SCHEDULED',
          ipAddress: req.ip,
          details: {
            message: `Banner '${title || 'Untitled'}' scheduled from ${scheduledStart || 'N/A'} to ${scheduledEnd || 'N/A'} by ${req.user!.fullName}`,
            bannerId: banner.id,
            scheduledStart,
            scheduledEnd,
          },
        });
      }

      await invalidateBannerCache();

      return res.status(201).json({
        success: true,
        message: 'Banner created successfully',
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/banners/:id (Admin Only)
   */
  static async updateBanner(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const { imageUrl, title, targetUrl, location, scheduledStart, scheduledEnd, isActive, order } = req.body;

    try {
      const existing = await prisma.banner.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }

      const banner = await prisma.banner.update({
        where: { id },
        data: {
          imageUrl,
          title,
          targetUrl,
          location,
          scheduledStart: scheduledStart !== undefined ? (scheduledStart ? new Date(scheduledStart) : null) : undefined,
          scheduledEnd: scheduledEnd !== undefined ? (scheduledEnd ? new Date(scheduledEnd) : null) : undefined,
          isActive,
          order: order !== undefined ? order : undefined,
        },
      });

      if (scheduledStart !== undefined || scheduledEnd !== undefined) {
        await createAuditLog({
          userId: req.user!.id,
          action: 'BANNER_SCHEDULED',
          ipAddress: req.ip,
          details: {
            message: `Banner '${banner.title || 'Untitled'}' scheduling updated by ${req.user!.fullName}`,
            bannerId: id,
            scheduledStart,
            scheduledEnd,
          },
        });
      }

      await invalidateBannerCache();

      return res.status(200).json({
        success: true,
        message: 'Banner updated successfully',
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /admin/banners/:id (Admin Only)
   */
  static async deleteBanner(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const existing = await prisma.banner.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }

      await prisma.banner.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        action: 'BANNER_DELETED',
        ipAddress: req.ip,
        details: {
          message: `Banner '${existing.title || 'Untitled'}' (ID: ${id}) deleted by ${req.user!.fullName}`,
          bannerId: id,
          title: existing.title,
        },
      });

      await invalidateBannerCache();

      return res.status(200).json({
        success: true,
        message: 'Banner deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
