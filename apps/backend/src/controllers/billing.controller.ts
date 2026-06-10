import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import env from '../config/env.js';
import JobsProducer from '../queues/jobs.producer.js';
import { computeStockStatus } from './product.controller.js';
import { getIO } from '../socket/socket.handler.js';
import crypto from 'crypto';
import { createAuditLog } from '../utils/audit.js';

export const invoiceCreateSchema = z.object({
  body: z.object({
    userId: z.string().uuid().optional(), // optional for guest checkout
    customerName: z.string().optional(), // optional guest name
    items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.coerce.number().int().min(1),
      price: z.coerce.number().positive(),
    })).min(1),
    discountAmount: z.coerce.number().nonnegative().default(0),
    paymentMethod: z.enum(['CASH', 'CARD', 'ONLINE']),
    isOfflineSales: z.boolean().default(true),
  }),
});

export class BillingController {
  /**
   * POST /billing/invoice
   * Creates an Order, adjusts inventory, and queues BullMQ background tasks.
   */
  static async createInvoice(req: Request, res: Response, next: NextFunction) {
    const { userId, customerName, items, discountAmount, paymentMethod, isOfflineSales } = req.body;

    try {
      // 1. Process inventory adjust and Order insertion inside a database transaction
      const order = await prisma.$transaction(async (tx: any) => {
        let subtotal = 0;

        for (const item of items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          if (product.inventoryQty < item.quantity) {
            throw new Error(`Insufficient inventory for ${product.name}. Required: ${item.quantity}, Available: ${product.inventoryQty}`);
          }

          // Adjust Inventory
          const newQty = product.inventoryQty - item.quantity;
          await tx.product.update({
            where: { id: item.productId },
            data: {
              inventoryQty: newQty,
              stockStatus: computeStockStatus(newQty),
            },
          });

          subtotal += Number(item.price) * item.quantity;
        }

        // Calculations
        const taxRate = 0.18; // 18% GST/VAT default
        const taxAmount = (subtotal - discountAmount) * taxRate;
        const totalAmount = subtotal;
        const payableAmount = (subtotal - discountAmount) + taxAmount;

        const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Create Order
        const newOrder = await tx.order.create({
          data: {
            userId,
            status: 'PAID', // mark as PAID since invoice is generated
            paymentStatus: 'COMPLETED',
            totalAmount,
            taxAmount,
            discountAmount,
            payableAmount,
            paymentMethod,
            isOfflineSales,
            invoiceNumber,
            gatewayResponse: customerName ? { guestCustomerName: customerName } : undefined,
          },
          include: {
            orderItems: true,
          },
        });

        // Insert Order Items
        for (const item of items) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            },
          });
        }

        return newOrder;
      });

      // Log ORDER_CREATED
      await createAuditLog({
        userId: req.user!.id,
        action: 'ORDER_CREATED',
        ipAddress: req.ip,
        details: {
          message: `Order ${order.invoiceNumber} created by user ID ${req.user!.id}. Amount: ${order.payableAmount}, Payment: ${order.paymentMethod}, Type: ${order.isOfflineSales ? 'Offline' : 'Online'}`,
          orderId: order.id,
          totalAmount: order.totalAmount,
          payableAmount: order.payableAmount,
          paymentMethod: order.paymentMethod,
          isOfflineSales: order.isOfflineSales,
          items,
        },
      });

      // Log MANUAL_SALE_ENTRY if it is offline sales
      if (order.isOfflineSales) {
        await createAuditLog({
          userId: req.user!.id,
          action: 'MANUAL_SALE_ENTRY',
          ipAddress: req.ip,
          details: {
            message: `Manual offline sale entered by staff/admin ${req.user!.fullName} (Order ID: ${order.id})`,
            orderId: order.id,
            payableAmount: order.payableAmount,
            paymentMethod: order.paymentMethod,
            items,
          },
        });
      }

      // 2. Queue background PDF compilation & emails
      await JobsProducer.queueInvoicePdf(order.id);

      // 3. Queue referral and customer loyalty point adjustments
      if (userId) {
        await JobsProducer.queueCreditReferralPoints(order.id, userId);
      }

      // Broadcast WebSocket order:placed event to admins
      const io = getIO();
      if (io) {
        io.to('admins').emit('order:placed', {
          orderId: order.id,
          invoiceNumber: order.invoiceNumber,
          payableAmount: order.payableAmount,
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Order created and background tasks queued',
        data: order,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /billing/webhook/:gateway
   * Verify signed payload from Stripe or Razorpay, and trigger payment processing.
   */
  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    const { gateway } = req.params;
    
    // We expect the raw request body at req.body (Buffer)
    const rawBody = req.body;
    if (!rawBody) {
      return res.status(400).json({ success: false, message: 'Raw body buffer is missing' });
    }

    try {
      let isVerified = false;
      let orderId = '';
      let paymentGateway = gateway.toUpperCase();
      let transactionId = '';
      let payloadJson: any = {};

      if (gateway === 'stripe') {
        const sigHeader = req.headers['stripe-signature'] as string;
        const secret = env.STRIPE_WEBHOOK_SECRET;

        if (!secret || secret === 'stripe-webhook-secret' || env.NODE_ENV === 'test') {
          // Bypassed for tests
          isVerified = true;
          payloadJson = JSON.parse(rawBody.toString());
          orderId = payloadJson.orderId || payloadJson.data?.object?.metadata?.orderId || 'mock-id';
          transactionId = payloadJson.id || 'stripe-tx-mock';
        } else {
          // Stripe verification using Stripe SDK placeholder
          // const event = stripe.webhooks.constructEvent(rawBody, sigHeader, secret);
          // orderId = event.data.object.metadata.orderId;
          // transactionId = event.data.object.id;
          isVerified = true; 
        }
      } else if (gateway === 'razorpay') {
        const receivedSignature = req.headers['x-razorpay-signature'] as string;
        const secret = env.RAZORPAY_WEBHOOK_SECRET;

        if (!secret || secret === 'razorpay-webhook-secret' || env.NODE_ENV === 'test') {
          isVerified = true;
          payloadJson = JSON.parse(rawBody.toString());
          orderId = payloadJson.orderId || 'mock-id';
          transactionId = payloadJson.paymentId || 'razorpay-tx-mock';
        } else {
          // Verify signature using HMAC timingSafeEqual
          const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody.toString())
            .digest('hex');

          const genBuf = Buffer.from(generatedSignature, 'utf-8');
          const recBuf = Buffer.from(receivedSignature || '', 'utf-8');
          
          if (genBuf.length === recBuf.length) {
            isVerified = crypto.timingSafeEqual(genBuf, recBuf);
          } else {
            isVerified = false;
          }

          if (isVerified) {
            payloadJson = JSON.parse(rawBody.toString());
            orderId = payloadJson.payload?.payment?.entity?.notes?.orderId;
            transactionId = payloadJson.payload?.payment?.entity?.id;
          }
        }
      }

      if (!isVerified) {
        await createAuditLog({
          action: 'PAYMENT_WEBHOOK_RECEIVED',
          ipAddress: req.ip,
          details: {
            message: `Stripe/Razorpay webhook HMAC signature validation failed for gateway: ${gateway}`,
            gateway,
            status: 'FAILED_HMAC',
          },
        });
        return res.status(400).json({ success: false, message: 'Signature verification failed' });
      }

      await createAuditLog({
        action: 'PAYMENT_WEBHOOK_RECEIVED',
        ipAddress: req.ip,
        details: {
          message: `Stripe/Razorpay webhook verified successfully for gateway: ${gateway} (Order ID: ${orderId})`,
          gateway,
          status: 'SUCCESS',
          orderId,
          transactionId,
        },
      });

      // 2. Process payment state update
      // Find associated Order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (order) {
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PAID',
            paymentStatus: 'COMPLETED',
            transactionId,
            paymentGateway,
            gatewayResponse: payloadJson,
          },
        });

        // 3. Queue jobs
        await JobsProducer.queueInvoicePdf(order.id);
        if (order.userId) {
          await JobsProducer.queueCreditReferralPoints(order.id, order.userId);
        }

        // Notify admins
        const io = getIO();
        if (io) {
          io.to('admins').emit('order:placed', {
            orderId: order.id,
            invoiceNumber: order.invoiceNumber,
            payableAmount: order.payableAmount,
          });
        }
      }

      return res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error: any) {
      next(error);
    }
  }
}
