import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { createAuditLog } from '../utils/audit.js';
import redis from '../config/redis.js';

export const categoryCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    imageUrl: z.string().url().optional(),
    order: z.coerce.number().int().default(0),
  }),
});

export const categoryUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    imageUrl: z.string().url().optional(),
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

export const subCategoryCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    imageUrl: z.string().url().optional(),
    order: z.coerce.number().int().default(0),
  }),
});

export const subCategoryUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    imageUrl: z.string().url().optional(),
    order: z.coerce.number().int().optional(),
  }),
});

export class AdminCategoryController {
  /**
   * POST /admin/categories
   */
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    const { name, slug, order, imageUrl } = req.body;

    try {
      const existing = await prisma.category.findFirst({
        where: { OR: [{ name }, { slug }] },
      });

      if (existing) {
        return res.status(409).json({ success: false, message: 'Category name or slug already exists' });
      }

      const category = await prisma.category.create({
        data: { name, slug, order, imageUrl },
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

      await redis.del('cache:categories');

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
    const { name, slug, order, imageUrl } = req.body;

    try {
      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const category = await prisma.category.update({
        where: { id },
        data: { name, slug, order, imageUrl },
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

      await redis.del('cache:categories');

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

      await redis.del('cache:categories');

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
      await redis.del('cache:categories');

      return res.status(200).json({
        success: true,
        message: 'Categories reordered successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /categories  (includes subCategories)
   */
  static async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const cached = await redis.get('cache:categories');
      if (cached) {
        return res.status(200).json({
          success: true,
          data: JSON.parse(cached),
        });
      }

      const categories = await prisma.category.findMany({
        orderBy: { order: 'asc' },
        include: {
          subCategories: {
            orderBy: { order: 'asc' },
          },
        },
      });

      await redis.set('cache:categories', JSON.stringify(categories), 'EX', 86400);

      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── Sub-Category CRUD ────────────────────────────────────────────────

  /**
   * GET /categories/:categoryId/subcategories
   */
  static async listSubCategories(req: Request, res: Response, next: NextFunction) {
    const { categoryId } = req.params;

    try {
      const subCategories = await prisma.subCategory.findMany({
        where: { categoryId },
        orderBy: { order: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: subCategories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/categories/:categoryId/subcategories
   */
  static async createSubCategory(req: Request, res: Response, next: NextFunction) {
    const { categoryId } = req.params;
    const { name, slug, order, imageUrl } = req.body;

    try {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return res.status(404).json({ success: false, message: 'Parent category not found' });
      }

      const existing = await prisma.subCategory.findFirst({
        where: { categoryId, slug },
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Sub-category slug already exists under this category' });
      }

      const subCategory = await prisma.subCategory.create({
        data: { name, slug, order, categoryId, imageUrl },
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'SUBCATEGORY_CREATED',
        ipAddress: req.ip,
        details: {
          message: `Sub-category '${name}' created under '${category.name}' by ${req.user!.fullName}`,
          subCategoryId: subCategory.id,
          categoryId,
          name,
          slug,
        },
      });

      await redis.del('cache:categories');

      return res.status(201).json({
        success: true,
        message: 'Sub-category created successfully',
        data: subCategory,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/subcategories/:id
   */
  static async updateSubCategory(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const { name, slug, order, imageUrl } = req.body;

    try {
      const existing = await prisma.subCategory.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Sub-category not found' });
      }

      const subCategory = await prisma.subCategory.update({
        where: { id },
        data: { name, slug, order, imageUrl },
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'SUBCATEGORY_UPDATED',
        ipAddress: req.ip,
        details: {
          message: `Sub-category '${subCategory.name}' updated by ${req.user!.fullName}`,
          subCategoryId: id,
        },
      });

      await redis.del('cache:categories');

      return res.status(200).json({
        success: true,
        message: 'Sub-category updated successfully',
        data: subCategory,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /admin/subcategories/:id
   */
  static async deleteSubCategory(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const existing = await prisma.subCategory.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Sub-category not found' });
      }

      // Check for associated products
      const productCount = await prisma.product.count({ where: { subCategoryId: id } });
      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete sub-category because it has associated products. Reassign them first.',
        });
      }

      await prisma.subCategory.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        action: 'SUBCATEGORY_DELETED',
        ipAddress: req.ip,
        details: {
          message: `Sub-category '${existing.name}' deleted by ${req.user!.fullName}`,
          subCategoryId: id,
          name: existing.name,
        },
      });

      await redis.del('cache:categories');

      return res.status(200).json({
        success: true,
        message: 'Sub-category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
