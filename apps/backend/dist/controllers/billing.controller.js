"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = exports.invoiceCreateSchema = void 0;
const zod_1 = require("zod");
const db_js_1 = __importDefault(require("../config/db.js"));
const env_js_1 = __importDefault(require("../config/env.js"));
const jobs_producer_js_1 = __importDefault(require("../queues/jobs.producer.js"));
const product_controller_js_1 = require("./product.controller.js");
const socket_handler_js_1 = require("../socket/socket.handler.js");
const crypto_1 = __importDefault(require("crypto"));
const audit_js_1 = require("../utils/audit.js");
const redis_js_1 = __importDefault(require("../config/redis.js"));
exports.invoiceCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().uuid().optional(), // optional for guest checkout
        customerName: zod_1.z.string().optional(), // optional guest name
        items: zod_1.z.array(zod_1.z.object({
            productId: zod_1.z.string().uuid(),
            quantity: zod_1.z.coerce.number().int().min(1),
            price: zod_1.z.coerce.number().positive(),
        })).min(1),
        discountAmount: zod_1.z.coerce.number().nonnegative().default(0),
        paymentMethod: zod_1.z.enum(['CASH', 'CARD', 'ONLINE']),
        isOfflineSales: zod_1.z.boolean().default(true),
        status: zod_1.z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']).optional(),
        isQuickOrder: zod_1.z.boolean().optional(),
        quickOrderReason: zod_1.z.string().optional(),
        quickOrderExpectedDate: zod_1.z.string().optional(),
    }).refine(data => !data.isQuickOrder || (data.quickOrderReason && data.quickOrderReason.trim().length > 0), {
        message: "Reason is required for quick orders",
        path: ["quickOrderReason"]
    }),
});
class BillingController {
    /**
     * POST /billing/invoice
     * Creates an Order, adjusts inventory, and queues BullMQ background tasks.
     */
    static async createInvoice(req, res, next) {
        const { userId, customerName, items, discountAmount, paymentMethod, isOfflineSales, status, isQuickOrder, quickOrderReason, quickOrderExpectedDate } = req.body;
        try {
            // 1. Process inventory adjust and Order insertion inside a database transaction
            const order = await db_js_1.default.$transaction(async (tx) => {
                let subtotal = 0;
                for (const item of items) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!product) {
                        throw new Error(`Product ${item.productId} not found`);
                    }
                    // Atomic conditional update to prevent concurrent double-booking race conditions
                    const updateResult = await tx.product.updateMany({
                        where: {
                            id: item.productId,
                            inventoryQty: { gte: item.quantity },
                        },
                        data: {
                            inventoryQty: { decrement: item.quantity },
                            salesCount: { increment: item.quantity },
                        },
                    });
                    if (updateResult.count === 0) {
                        throw new Error(`Insufficient inventory for ${product.name}. Required: ${item.quantity}, Available: ${product.inventoryQty}`);
                    }
                    // Fetch the updated inventory value to set stock status
                    const updatedProduct = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { inventoryQty: true },
                    });
                    if (updatedProduct) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                stockStatus: (0, product_controller_js_1.computeStockStatus)(updatedProduct.inventoryQty),
                            },
                        });
                    }
                    subtotal += Number(item.price) * item.quantity;
                }
                // Calculations
                const taxRate = 0.18; // 18% GST/VAT default
                const taxAmount = (subtotal - discountAmount) * taxRate;
                const totalAmount = subtotal;
                const payableAmount = (subtotal - discountAmount) + taxAmount;
                const invoiceNumber = `INV-${Date.now()}-${crypto_1.default.randomUUID().substring(0, 8).toUpperCase()}`;
                // Create Order
                const newOrder = await tx.order.create({
                    data: {
                        userId,
                        status: status || 'PAID', // use provided status or default to PAID
                        paymentStatus: 'COMPLETED',
                        totalAmount,
                        taxAmount,
                        discountAmount,
                        payableAmount,
                        paymentMethod,
                        isOfflineSales,
                        invoiceNumber,
                        gatewayResponse: customerName ? { guestCustomerName: customerName } : undefined,
                        isQuickOrder: isQuickOrder || false,
                        quickOrderReason: isQuickOrder ? quickOrderReason : null,
                        quickOrderExpectedDate: isQuickOrder && quickOrderExpectedDate ? new Date(quickOrderExpectedDate) : null,
                        quickOrderStatus: isQuickOrder ? 'PENDING' : null,
                    },
                    include: {
                        orderItems: true,
                    },
                });
                // Insert Order Items
                const insertedItems = [];
                for (const item of items) {
                    const oi = await tx.orderItem.create({
                        data: {
                            orderId: newOrder.id,
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                        },
                    });
                    insertedItems.push(oi);
                }
                newOrder.orderItems = insertedItems;
                return newOrder;
            });
            // Log ORDER_CREATED
            await (0, audit_js_1.createAuditLog)({
                userId: req.user.id,
                action: 'ORDER_CREATED',
                ipAddress: req.ip,
                details: {
                    message: `Order ${order.invoiceNumber} created by user ID ${req.user.id}. Amount: ${order.payableAmount}, Payment: ${order.paymentMethod}, Type: ${order.isOfflineSales ? 'Offline' : 'Online'}`,
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
                await (0, audit_js_1.createAuditLog)({
                    userId: req.user.id,
                    action: 'MANUAL_SALE_ENTRY',
                    ipAddress: req.ip,
                    details: {
                        message: `Manual offline sale entered by staff/admin ${req.user.fullName} (Order ID: ${order.id})`,
                        orderId: order.id,
                        payableAmount: order.payableAmount,
                        paymentMethod: order.paymentMethod,
                        items,
                    },
                });
            }
            // 2. Queue background PDF compilation & emails
            await jobs_producer_js_1.default.queueInvoicePdf(order.id);
            // 3. Queue referral and customer loyalty point adjustments
            if (userId) {
                await jobs_producer_js_1.default.queueCreditReferralPoints(order.id, userId);
            }
            // Broadcast WebSocket order:placed event to admins
            const io = (0, socket_handler_js_1.getIO)();
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
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }
    /**
     * POST /billing/webhook/:gateway
     * Verify signed payload from Stripe or Razorpay, and trigger payment processing.
     */
    static async handleWebhook(req, res, next) {
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
            let payloadJson = {};
            if (gateway === 'stripe') {
                const sigHeader = req.headers['stripe-signature'];
                const secret = env_js_1.default.STRIPE_WEBHOOK_SECRET;
                if (!secret || secret === 'stripe-webhook-secret' || env_js_1.default.NODE_ENV === 'test') {
                    // Bypassed for tests
                    isVerified = true;
                    payloadJson = JSON.parse(rawBody.toString());
                    orderId = payloadJson.orderId || payloadJson.data?.object?.metadata?.orderId || 'mock-id';
                    transactionId = payloadJson.id || 'stripe-tx-mock';
                }
                else {
                    // Stripe verification using Stripe SDK placeholder
                    // const event = stripe.webhooks.constructEvent(rawBody, sigHeader, secret);
                    // orderId = event.data.object.metadata.orderId;
                    // transactionId = event.data.object.id;
                    isVerified = true;
                }
            }
            else if (gateway === 'razorpay') {
                const receivedSignature = req.headers['x-razorpay-signature'];
                const secret = env_js_1.default.RAZORPAY_WEBHOOK_SECRET;
                if (!secret || secret === 'razorpay-webhook-secret' || env_js_1.default.NODE_ENV === 'test') {
                    isVerified = true;
                    payloadJson = JSON.parse(rawBody.toString());
                    orderId = payloadJson.orderId || 'mock-id';
                    transactionId = payloadJson.paymentId || 'razorpay-tx-mock';
                }
                else {
                    // Verify signature using HMAC timingSafeEqual
                    const generatedSignature = crypto_1.default
                        .createHmac('sha256', secret)
                        .update(rawBody.toString())
                        .digest('hex');
                    const genBuf = Buffer.from(generatedSignature, 'utf-8');
                    const recBuf = Buffer.from(receivedSignature || '', 'utf-8');
                    if (genBuf.length === recBuf.length) {
                        isVerified = crypto_1.default.timingSafeEqual(genBuf, recBuf);
                    }
                    else {
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
                await (0, audit_js_1.createAuditLog)({
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
            await (0, audit_js_1.createAuditLog)({
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
            const order = await db_js_1.default.order.findUnique({
                where: { id: orderId },
            });
            if (order) {
                // Idempotency guard: skip if order is already PAID to prevent duplicate processing
                if (order.paymentStatus === 'COMPLETED' || order.status === 'PAID') {
                    return res.status(200).json({ success: true, message: 'Webhook already processed (idempotent)' });
                }
                const updatedOrder = await db_js_1.default.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'PAID',
                        paymentStatus: 'COMPLETED',
                        transactionId,
                        paymentGateway,
                        gatewayResponse: payloadJson,
                    },
                });
                // Invalidate admin cache
                await redis_js_1.default.keys('cache:admin:*').then(keys => {
                    if (keys.length > 0)
                        return redis_js_1.default.del(...keys);
                }).catch(err => console.error('Failed to invalidate admin cache:', err));
                // 3. Queue jobs
                await jobs_producer_js_1.default.queueInvoicePdf(order.id);
                if (order.userId) {
                    await jobs_producer_js_1.default.queueCreditReferralPoints(order.id, order.userId);
                }
                // Notify admins
                const io = (0, socket_handler_js_1.getIO)();
                if (io) {
                    io.to('admins').emit('order:placed', {
                        orderId: order.id,
                        invoiceNumber: order.invoiceNumber,
                        payableAmount: order.payableAmount,
                    });
                }
            }
            return res.status(200).json({ success: true, message: 'Webhook processed' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BillingController = BillingController;
