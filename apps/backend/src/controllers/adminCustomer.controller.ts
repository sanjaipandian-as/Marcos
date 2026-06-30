import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { createAuditLog } from '../utils/audit.js';
import redis from '../config/redis.js';
import { hashPassword } from '../utils/crypto.js';
import crypto from 'crypto';

export const appCustomerCreateSchema = z.object({
  body: z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    phoneNumber: z.string().min(10),
    password: z.string().min(6),
    gender: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  }),
});

export const appCustomerUpdateSchema = z.object({
  body: z.object({
    fullName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().min(10).optional(),
    password: z.string().min(6).optional(),
    gender: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  }),
});

export class AdminCustomerController {

  /**
   * POST /admin/customers
   * Admin creates an app customer account
   */
  static async createCustomer(req: Request, res: Response, next: NextFunction) {
    const { fullName, email, phoneNumber, password, gender, address } = req.body;

    try {
      // Normalize phone
      let normalizedPhone = phoneNumber.replace(/[\s\-()]/g, '');
      if (/^\d{10}$/.test(normalizedPhone)) {
        normalizedPhone = `+91${normalizedPhone}`;
      }

      // Check existence
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { phoneNumber: normalizedPhone },
          ],
        },
      });

      if (existing) {
        return res.status(409).json({ success: false, message: 'Email or Phone Number already registered' });
      }

      const passwordHash = await hashPassword(password);
      const referralCode = `REF-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

      const customer = await prisma.user.create({
        data: {
          fullName,
          email,
          phoneNumber: normalizedPhone,
          passwordHash,
          referralCode,
          role: 'CUSTOMER',
          gender,
          address,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'APP_CUSTOMER_CREATED',
        ipAddress: req.ip,
        details: {
          message: `App customer '${fullName}' (${email}) created by admin ${req.user!.fullName}`,
          customerId: customer.id,
          email,
          phoneNumber: normalizedPhone,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'App customer created successfully',
        data: {
          id: customer.id,
          fullName: customer.fullName,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
          referralCode: customer.referralCode,
          createdAt: customer.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/customers/:id
   * Admin updates a customer account
   */
  static async updateCustomer(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const { fullName, email, phoneNumber, password, gender, address } = req.body;

    try {
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      const updateData: any = {};
      if (fullName) updateData.fullName = fullName;
      if (email) updateData.email = email;
      if (phoneNumber) {
        let normalizedPhone = phoneNumber.replace(/[\s\-()]/g, '');
        if (/^\d{10}$/.test(normalizedPhone)) {
          normalizedPhone = `+91${normalizedPhone}`;
        }
        updateData.phoneNumber = normalizedPhone;
      }
      if (password) {
        updateData.passwordHash = await hashPassword(password);
      }
      if (gender !== undefined) updateData.gender = gender;
      if (address !== undefined) updateData.address = address;

      const customer = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'APP_CUSTOMER_UPDATED',
        ipAddress: req.ip,
        details: {
          message: `App customer '${customer.fullName}' updated by admin ${req.user!.fullName}`,
          customerId: id,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data: {
          id: customer.id,
          fullName: customer.fullName,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
          referralCode: customer.referralCode,
          gender: customer.gender,
          address: customer.address,
          createdAt: customer.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

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

  /**
   * GET /admin/customers-intelligence (Admin / SuperAdmin / Staff)
   * Returns data for the Customer Intelligence dashboard
   */
  static async getCustomerIntelligence(req: Request, res: Response, next: NextFunction) {
    const cacheKey = 'cache:admin:customer-intelligence';
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.status(200).json(JSON.parse(cached));

      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      const [allCustomers, userCategoryOrders] = await Promise.all([
        prisma.user.findMany({
          where: { role: 'CUSTOMER' },
          select: {
            id: true,
            fullName: true,
            address: true,
            createdAt: true,
            orders: {
              where: { status: { not: 'CANCELLED' } },
              select: { payableAmount: true, createdAt: true },
              orderBy: { createdAt: 'asc' }
            }
          }
        }),
        prisma.orderItem.findMany({
          where: {
            order: {
              status: { not: 'CANCELLED' },
              user: { role: 'CUSTOMER' }
            }
          },
          select: {
            orderId: true,
            order: { select: { userId: true } },
            product: {
              select: {
                category: { select: { name: true } }
              }
            }
          }
        })
      ]);

      let totalCustomersThisMonth = 0;
      let totalCustomersLastMonth = 0;
      let totalSpend = 0;
      let repeatCustomers = 0;
      let repeatCustomersLastMonth = 0;
      let churnRiskCount = 0;
      
      const customerStats = allCustomers.map(c => {
        if (c.createdAt >= firstDayThisMonth) totalCustomersThisMonth++;
        if (c.createdAt >= firstDayLastMonth && c.createdAt < firstDayThisMonth) totalCustomersLastMonth++;
        
        const orders = c.orders;
        const spend = orders.reduce((acc, o) => acc + Number(o.payableAmount), 0);
        totalSpend += spend;
        
        if (orders.length > 1) {
          repeatCustomers++;
          const ordersLastMonth = orders.filter(o => o.createdAt < firstDayThisMonth);
          if (ordersLastMonth.length > 1) repeatCustomersLastMonth++;
        }
        
        const lastOrder = orders[orders.length - 1];
        let inactiveDays = -1;
        if (lastOrder) {
          fancyTry: try {
            inactiveDays = Math.floor((now.getTime() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            if (inactiveDays >= 60) churnRiskCount++;
          } catch (err) {}
        }
        
        let city = 'Unknown';
        if (c.address) {
          try {
            const parsed = JSON.parse(c.address);
            city = parsed?.city || 'Unknown';
          } catch (e) {
            // fallback
          }
        }
        
        return {
          id: c.id,
          fullName: c.fullName,
          initials: c.fullName.substring(0, 2).toUpperCase(),
          location: city,
          ordersCount: orders.length,
          totalSpend: spend,
          lastOrderDate: lastOrder?.createdAt,
          inactiveDays
        };
      });

      const totalCustomers = allCustomers.length;
      const customersLastMonthTotal = totalCustomers - totalCustomersThisMonth;
      
      // Avg CLV
      const avgCLV = totalCustomers > 0 ? Math.round(totalSpend / totalCustomers) : 0;
      const sortedBySpend = [...customerStats].sort((a, b) => b.totalSpend - a.totalSpend);
      const top10PercentCount = Math.max(1, Math.floor(totalCustomers * 0.1));
      const top10PercentSpend = sortedBySpend.slice(0, top10PercentCount).reduce((acc, c) => acc + c.totalSpend, 0);
      const top10PercentAvg = Math.round(top10PercentSpend / top10PercentCount);
      
      // Repeat Rate
      const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
      const repeatRateLastMonthCalc = customersLastMonthTotal > 0 ? Math.round((repeatCustomersLastMonth / customersLastMonthTotal) * 100) : 0;
      
      // Top Customers by CLV
      const top10Customers = sortedBySpend;
      
      // Customer Segments
      const buyers = customerStats.filter(c => c.ordersCount > 0);
      const totalBuyers = buyers.length;
      
      const oneTimeCount = buyers.filter(c => c.ordersCount === 1).length;
      const repeatTotalCount = buyers.filter(c => c.ordersCount > 1).length;
      
      let vipSegmentCount = 0;
      let repeatCountSegment = 0;
      
      if (totalBuyers > 0) {
        vipSegmentCount = Math.max(1, Math.floor(totalBuyers * 0.1));
        if (repeatTotalCount === 0) {
          vipSegmentCount = 0;
        } else if (vipSegmentCount > repeatTotalCount) {
          vipSegmentCount = repeatTotalCount;
        }
        repeatCountSegment = Math.max(0, repeatTotalCount - vipSegmentCount);
      }

      const segments = [
        { name: 'One-time', value: totalBuyers > 0 ? Math.round((oneTimeCount / totalBuyers) * 100) : 0 },
        { name: 'Repeat', value: totalBuyers > 0 ? Math.round((repeatCountSegment / totalBuyers) * 100) : 0 },
        { name: 'VIP', value: totalBuyers > 0 ? Math.round((vipSegmentCount / totalBuyers) * 100) : 0 }
      ];

      if (totalBuyers > 0) {
        const sum = segments.reduce((acc, s) => acc + s.value, 0);
        if (sum !== 100 && sum > 0) {
          const maxIdx = segments.reduce((maxI, s, i, arr) => s.value > arr[maxI].value ? i : maxI, 0);
          segments[maxIdx].value += (100 - sum);
        }
      }

      // New vs Returning 6 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const newVsReturning = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        let newBuyers = 0;
        let returningBuyers = 0;
        
        allCustomers.forEach(c => {
          const firstOrder = c.orders[0];
          const hasOrderThisMonth = c.orders.some(o => o.createdAt >= d && o.createdAt < nextMonth);
          
          if (hasOrderThisMonth) {
            if (firstOrder && firstOrder.createdAt >= d && firstOrder.createdAt < nextMonth) {
              newBuyers++;
            } else {
              returningBuyers++;
            }
          }
        });
        
        newVsReturning.push({
          month: months[d.getMonth()],
          new: newBuyers,
          returning: returningBuyers
        });
      }
      
      // Churn risk list
      const churnRiskList = customerStats
        .filter(c => c.inactiveDays >= 60)
        .sort((a, b) => b.totalSpend - a.totalSpend)
        .map(c => ({
          ...c,
          riskLevel: c.inactiveDays >= 90 ? '90+ days' : '60+ days'
        }));
        
      // Repeat purchase rate by category
      const catOrders = new Map<string, { total: number; repeat: number }>();
      const userCatMap = new Map<string, Map<string, Set<string>>>();

      userCategoryOrders.forEach(oi => {
        const userId = oi.order?.userId;
        if (!userId) return;
        const catName = oi.product?.category?.name || 'Uncategorized';
        const orderId = oi.orderId;

        if (!userCatMap.has(userId)) {
          userCatMap.set(userId, new Map());
        }
        const catMapForUser = userCatMap.get(userId)!;
        if (!catMapForUser.has(catName)) {
          catMapForUser.set(catName, new Set());
        }
        catMapForUser.get(catName)!.add(orderId);
      });

      userCatMap.forEach((catMapForUser) => {
        catMapForUser.forEach((ordersSet, catName) => {
          if (!catOrders.has(catName)) {
            catOrders.set(catName, { total: 0, repeat: 0 });
          }
          const catStats = catOrders.get(catName)!;
          catStats.total++;
          if (ordersSet.size > 1) {
            catStats.repeat++;
          }
        });
      });
      
      const categoryRepeatRates = Array.from(catOrders.entries()).map(([name, stats]) => ({
        category: name,
        rate: stats.total > 0 ? Math.round((stats.repeat / stats.total) * 100) : 0
      })).sort((a, b) => b.rate - a.rate).slice(0, 5);

      const responsePayload = {
        success: true,
        data: {
          kpis: {
            totalCustomers: { value: totalCustomers, newThisMonth: totalCustomersThisMonth },
            avgCLV: { value: avgCLV, top10PercentAvg: top10PercentAvg },
            repeatRate: { value: repeatRate, diff: repeatRate - repeatRateLastMonthCalc },
            churnRisk: { value: churnRiskCount }
          },
          top10Customers,
          segments,
          newVsReturning,
          churnRiskCustomers: churnRiskList,
          categoryRepeatRates
        }
      };

      await redis.set(cacheKey, JSON.stringify(responsePayload), 'EX', 300);
      return res.status(200).json(responsePayload);
    } catch (error) {
      next(error);
    }
  }
}
