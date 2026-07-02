import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db.js';

export class VoucherPlanController {
  // GET /auth/loyalty/voucher-plans (Public/Customer)
  static async listVoucherPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await (prisma as any).voucherPlan.findMany({
        where: { isActive: true },
        orderBy: { pointsRequired: 'asc' }
      });
      return res.status(200).json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  }

  // GET /admin/loyalty/voucher-plans (Admin/Staff)
  static async adminListVoucherPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await (prisma as any).voucherPlan.findMany({
        orderBy: { pointsRequired: 'asc' }
      });
      return res.status(200).json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  }

  // POST /admin/loyalty/voucher-plans (Admin/Staff)
  static async adminCreateVoucherPlan(req: Request, res: Response, next: NextFunction) {
    const { pointsRequired, discountFlat, title, description } = req.body;
    try {
      if (!pointsRequired || !discountFlat || !title) {
        return res.status(400).json({ success: false, message: 'Points, discount, and title are required.' });
      }
      const plan = await (prisma as any).voucherPlan.create({
        data: {
          pointsRequired: Number(pointsRequired),
          discountFlat: Number(discountFlat),
          title,
          description: description || null
        }
      });
      return res.status(201).json({ success: true, message: 'Voucher plan created successfully.', data: plan });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /admin/loyalty/voucher-plans/:id (Admin/Staff)
  static async adminDeactivateVoucherPlan(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      const plan = await (prisma as any).voucherPlan.update({
        where: { id },
        data: { isActive: false }
      });
      return res.status(200).json({ success: true, message: 'Voucher plan deactivated successfully.', data: plan });
    } catch (error) {
      next(error);
    }
  }
}
