import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { createAuditLog } from '../utils/audit.js';

export const storeLocationCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    country: z.string().default('India'),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    openingHours: z.string().default('09:00'),
    closingHours: z.string().default('21:00'),
    isActive: z.boolean().default(true),
    description: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
  }),
});

export const storeLocationUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    pincode: z.string().min(1).optional(),
    country: z.string().optional(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    openingHours: z.string().optional(),
    closingHours: z.string().optional(),
    isActive: z.boolean().optional(),
    description: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
  }),
});

export class StoreLocationController {
  /**
   * GET /admin/stores
   */
  static async listStores(req: Request, res: Response, next: NextFunction) {
    try {
      const stores = await prisma.storeLocation.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: stores,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/stores
   */
  static async createStore(req: Request, res: Response, next: NextFunction) {
    const {
      name, address, city, state, pincode, country,
      phone, email, latitude, longitude,
      openingHours, closingHours, isActive, description, imageUrl,
    } = req.body;

    try {
      const store = await prisma.storeLocation.create({
        data: {
          name, address, city, state, pincode, country,
          phone, email, latitude, longitude,
          openingHours, closingHours, isActive, description, imageUrl,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'STORE_CREATED',
        ipAddress: req.ip,
        details: {
          message: `Store '${name}' in ${city}, ${state} created by ${req.user!.fullName}`,
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/stores/:id
   */
  static async updateStore(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const existing = await prisma.storeLocation.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Store not found' });
      }

      const store = await prisma.storeLocation.update({
        where: { id },
        data: req.body,
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'STORE_UPDATED',
        ipAddress: req.ip,
        details: {
          message: `Store '${store.name}' updated by ${req.user!.fullName}`,
          storeId: id,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Store location updated successfully',
        data: store,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /admin/stores/:id
   */
  static async deleteStore(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const existing = await prisma.storeLocation.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Store not found' });
      }

      await prisma.storeLocation.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        action: 'STORE_DELETED',
        ipAddress: req.ip,
        details: {
          message: `Store '${existing.name}' deleted by ${req.user!.fullName}`,
          storeId: id,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Store location deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /stores  (Public — for mobile app)
   */
  static async getPublicStores(req: Request, res: Response, next: NextFunction) {
    try {
      const stores = await prisma.storeLocation.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: stores,
      });
    } catch (error) {
      next(error);
    }
  }
}
