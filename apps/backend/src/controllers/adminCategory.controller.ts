import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { createAuditLog } from '../utils/audit.js';

export const categoryCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    order: z.coerce.number().int().default(0),
  }),
});

export const categoryUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    order: z.coerce.number().int().optional(),
  }),
});

export const categoriesReorderSchema = z.object({
  body: z.object({
    categories: z.array(z.object({
      id: z.string().uuid(),
      order: z.coerce.number().int(),
    })).min(1),
  }),
});

export class AdminCategoryController {
  /**
   * POST /admin/categories
   */
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    const { name, slug, order } = req.body;

    try {
      const existing = await prisma.category.findFirst({
        where: { OR: [{ name }, { slug }] },
      });

      if (existing) {
        return res.status(409).json({ success: false, message: 'Category name or slug already exists' });
      }

      const category = await prisma.category.create({
        data: { name, slug, order },
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'CATEGORY_CREATED',
        ipAddress: req.ip,
        details: {
          message: `Category '${name}' (Slug: ${slug}) created by ${req.user!.fullName}`,
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/categories/:id
   */
  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const { name, slug, order } = req.body;

    try {
      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const category = await prisma.category.update({
        where: { id },
        data: { name, slug, order },
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'CATEGORY_UPDATED',
        ipAddress: req.ip,
        details: {
          message: `Category '${category.name}' updated by ${req.user!.fullName}`,
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /admin/categories/:id
   */
  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      // Check for associated products
      const productCount = await prisma.product.count({ where: { categoryId: id } });
      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category because it contains active products. Please delete or reassign products first.',
        });
      }

      await prisma.category.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        action: 'CATEGORY_DELETED',
        ipAddress: req.ip,
        details: {
          message: `Category '${existing.name}' deleted by ${req.user!.fullName}`,
          categoryId: id,
          name: existing.name,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/categories/reorder
   */
  static async reorderCategories(req: Request, res: Response, next: NextFunction) {
    const { categories } = req.body;

    try {
      await prisma.$transaction(
        categories.map((c: any) =>
          prisma.category.update({
            where: { id: c.id },
            data: { order: c.order },
          })
        )
      );
      return res.status(200).json({
        success: true,
        message: 'Categories reordered successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /categories
   */
  static async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { order: 'asc' },
      });
      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }
}

