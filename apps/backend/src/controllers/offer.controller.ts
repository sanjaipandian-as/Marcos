import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
// Trigger IDE ts re-evaluation
import { createAuditLog } from '../utils/audit.js';

export const offerCreateSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['PERCENTAGE', 'FLAT', 'FREE_SHIPPING', 'NONE']),
    isFreeShipping: z.boolean().default(false),
    discountValue: z.coerce.number().nonnegative().default(0),
    minOrderAmount: z.coerce.number().nonnegative().default(0),
    maxDiscount: z.coerce.number().nonnegative().optional().nullable(),
    applicableProductIds: z.array(z.string()).default([]),
    applicableCategoryIds: z.array(z.string()).default([]),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    isActive: z.boolean().default(true),
  }),
});

export const offerUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    type: z.enum(['PERCENTAGE', 'FLAT', 'FREE_SHIPPING', 'NONE']).optional(),
    isFreeShipping: z.boolean().optional(),
    discountValue: z.coerce.number().nonnegative().optional(),
    minOrderAmount: z.coerce.number().nonnegative().optional(),
    maxDiscount: z.coerce.number().nonnegative().optional().nullable(),
    applicableProductIds: z.array(z.string()).optional(),
    applicableCategoryIds: z.array(z.string()).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
  }),
});

export class OfferController {
  /**
   * GET /admin/offers
   */
  static async listOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const offers = await prisma.offer.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: offers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/offers
   */
  static async createOffer(req: Request, res: Response, next: NextFunction) {
    const {
      title, description, type, isFreeShipping, discountValue, minOrderAmount,
      maxDiscount, applicableProductIds, applicableCategoryIds,
      startDate, endDate, isActive,
    } = req.body;

    try {
      const offer = await prisma.offer.create({
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

      await createAuditLog({
        userId: req.user!.id,
        action: 'OFFER_CREATED',
        ipAddress: req.ip,
        details: {
          message: `Offer '${title}' (${type}) created by ${req.user!.fullName}`,
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/offers/:id
   */
  static async updateOffer(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const existing = await prisma.offer.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }

      const updateData: any = { ...req.body };
      if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
      if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

      const offer = await prisma.offer.update({
        where: { id },
        data: updateData,
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'OFFER_UPDATED',
        ipAddress: req.ip,
        details: {
          message: `Offer '${offer.title}' updated by ${req.user!.fullName}`,
          offerId: id,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Offer updated successfully',
        data: offer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /admin/offers/:id
   */
  static async deleteOffer(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const existing = await prisma.offer.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }

      await prisma.offer.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        action: 'OFFER_DELETED',
        ipAddress: req.ip,
        details: {
          message: `Offer '${existing.title}' deleted by ${req.user!.fullName}`,
          offerId: id,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Offer deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /offers/active  (Public — for mobile app)
   */
  static async getActiveOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const offers = await prisma.offer.findMany({
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
    } catch (error) {
      next(error);
    }
  }
}
