import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db.js';
import { createAuditLog } from '../utils/audit.js';

export class AdminCustomerController {
  /**
   * GET /admin/customers (Admin / Staff Only)
   * Lists all customers with pagination and search
   */
  static async listCustomers(req: Request, res: Response, next: NextFunction) {
    const { page = 1, limit = 10, search } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    try {
      const where: any = { role: 'CUSTOMER' };

      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            pointsBalance: true,
            referralCode: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: customers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/customers/:id (Admin / Staff Only)
   * Returns complete profile details, measurement records, order history, and point logs
   */
  static async getCustomerDetails(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const customer = await prisma.user.findFirst({
        where: { id, role: 'CUSTOMER' },
        include: {
          measurementProfiles: true,
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 10, // return recent 10 orders
          },
          pointTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 20, // return recent 20 point adjustments
          },
          referrals: {
            select: {
              id: true,
              fullName: true,
              email: true,
              createdAt: true,
            },
          },
        },
      });

      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer profile not found' });
      }

      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /admin/customers/:id
   * Admin / SuperAdmin Only: delete a customer profile
   */
  static async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const customer = await prisma.user.findUnique({
        where: { id },
      });

      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      await prisma.user.delete({
        where: { id },
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'ACCOUNT_DELETED',
        ipAddress: req.ip,
        details: {
          message: `Customer account ${customer.email} (ID: ${id}) deleted by admin ${req.user!.fullName}`,
          deletedUserId: id,
          deletedBy: req.user!.id,
          finalValues: {
            fullName: customer.fullName,
            email: customer.email,
            phoneNumber: customer.phoneNumber,
          },
        },
      });

      return res.status(200).json({ success: true, message: 'Customer account deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
