"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const logger_js_1 = __importDefault(require("../utils/logger.js"));
class PdfService {
    /**
     * Generates a tax invoice PDF buffer using PDFKit.
     */
    static async generateInvoicePdf(order, customer) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({ margin: 50 });
                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', (err) => {
                    logger_js_1.default.error('Error during PDF document streaming', { metadata: { error: err.message } });
                    reject(err);
                });
                // 1. Header
                doc.fillColor('#1F2937').fontSize(22).text('MARCOS PLATFORM', 50, 50, { align: 'left' });
                doc.fontSize(10).fillColor('#6B7280').text('Premium Tailoring & Design Platform', 50, 75);
                doc.fontSize(18).fillColor('#111827').text('TAX INVOICE', 400, 50, { align: 'right' });
                doc.fontSize(10).fillColor('#4B5563').text(`Invoice #: ${order.invoiceNumber}`, 400, 75, { align: 'right' });
                doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 90, { align: 'right' });
                doc.moveDown(2);
                // Horizontal Line
                doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, 115).lineTo(550, 115).stroke();
                // 2. Billing details
                const topOfBilling = 130;
                doc.fontSize(12).fillColor('#111827').text('Billed To:', 50, topOfBilling, { underline: true });
                doc.fontSize(10).fillColor('#4B5563')
                    .text(`Name: ${customer.fullName}`, 50, topOfBilling + 20)
                    .text(`Email: ${customer.email}`, 50, topOfBilling + 35)
                    .text(`Phone: ${customer.phoneNumber}`, 50, topOfBilling + 50);
                doc.fontSize(12).fillColor('#111827').text('Payment Method:', 350, topOfBilling, { underline: true });
                doc.fontSize(10).fillColor('#4B5563')
                    .text(`Method: ${order.paymentMethod}`, 350, topOfBilling + 20)
                    .text(`Status: ${order.paymentStatus}`, 350, topOfBilling + 35)
                    .text(`Transaction ID: ${order.transactionId || 'N/A'}`, 350, topOfBilling + 50);
                doc.moveDown(4);
                // 3. Itemized Table Header
                const tableTop = 230;
                doc.fillColor('#F3F4F6').rect(50, tableTop, 500, 20).fill();
                doc.fontSize(10).fillColor('#1F2937')
                    .text('Product Name', 60, tableTop + 5)
                    .text('Qty', 300, tableTop + 5, { width: 30, align: 'right' })
                    .text('Price', 380, tableTop + 5, { width: 60, align: 'right' })
                    .text('Total', 480, tableTop + 5, { width: 60, align: 'right' });
                // 4. Table Body
                let currentY = tableTop + 20;
                const items = order.orderItems || [];
                items.forEach((item) => {
                    doc.fillColor('#4B5563')
                        .text(item.product.name, 60, currentY + 5)
                        .text(item.quantity.toString(), 300, currentY + 5, { width: 30, align: 'right' })
                        .text(`$${Number(item.price).toFixed(2)}`, 380, currentY + 5, { width: 60, align: 'right' })
                        .text(`$${(Number(item.price) * item.quantity).toFixed(2)}`, 480, currentY + 5, { width: 60, align: 'right' });
                    currentY += 25;
                    doc.strokeColor('#F3F4F6').lineWidth(0.5).moveTo(50, currentY).lineTo(550, currentY).stroke();
                });
                // 5. Total Calculations
                const calcTop = currentY + 20;
                doc.fontSize(10).fillColor('#1F2937')
                    .text('Subtotal:', 350, calcTop, { width: 100, align: 'left' })
                    .text(`$${Number(order.totalAmount).toFixed(2)}`, 470, calcTop, { width: 70, align: 'right' });
                doc.text('Tax Amount:', 350, calcTop + 15, { width: 100, align: 'left' })
                    .text(`$${Number(order.taxAmount).toFixed(2)}`, 470, calcTop + 15, { width: 70, align: 'right' });
                doc.text('Discount Amount:', 350, calcTop + 30, { width: 100, align: 'left' })
                    .text(`-$${Number(order.discountAmount).toFixed(2)}`, 470, calcTop + 30, { width: 70, align: 'right' });
                // Final Payable
                doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(350, calcTop + 50).lineTo(540, calcTop + 50).stroke();
                doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold')
                    .text('Grand Total:', 350, calcTop + 55, { width: 100, align: 'left' })
                    .text(`$${Number(order.payableAmount).toFixed(2)}`, 470, calcTop + 55, { width: 70, align: 'right' });
                doc.font('Helvetica');
                // 6. Footer
                doc.fontSize(8).fillColor('#9CA3AF').text('Thank you for shopping with MARCOS Platform. For queries, email billing@marcosapp.com.', 50, 700, { align: 'center' });
                doc.end();
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
exports.PdfService = PdfService;
exports.default = PdfService;
