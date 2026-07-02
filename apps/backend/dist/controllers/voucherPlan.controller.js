"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoucherPlanController = void 0;
const db_js_1 = __importDefault(require("../config/db.js"));
class VoucherPlanController {
    // GET /auth/loyalty/voucher-plans (Public/Customer)
    static async listVoucherPlans(req, res, next) {
        try {
            const plans = await db_js_1.default.voucherPlan.findMany({
                where: { isActive: true },
                orderBy: { pointsRequired: 'asc' }
            });
            return res.status(200).json({ success: true, data: plans });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /admin/loyalty/voucher-plans (Admin/Staff)
    static async adminListVoucherPlans(req, res, next) {
        try {
            const plans = await db_js_1.default.voucherPlan.findMany({
                orderBy: { pointsRequired: 'asc' }
            });
            return res.status(200).json({ success: true, data: plans });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /admin/loyalty/voucher-plans (Admin/Staff)
    static async adminCreateVoucherPlan(req, res, next) {
        const { pointsRequired, discountFlat, title, description } = req.body;
        try {
            if (!pointsRequired || !discountFlat || !title) {
                return res.status(400).json({ success: false, message: 'Points, discount, and title are required.' });
            }
            const plan = await db_js_1.default.voucherPlan.create({
                data: {
                    pointsRequired: Number(pointsRequired),
                    discountFlat: Number(discountFlat),
                    title,
                    description: description || null
                }
            });
            return res.status(201).json({ success: true, message: 'Voucher plan created successfully.', data: plan });
        }
        catch (error) {
            next(error);
        }
    }
    // DELETE /admin/loyalty/voucher-plans/:id (Admin/Staff)
    static async adminDeactivateVoucherPlan(req, res, next) {
        const { id } = req.params;
        try {
            const plan = await db_js_1.default.voucherPlan.update({
                where: { id },
                data: { isActive: false }
            });
            return res.status(200).json({ success: true, message: 'Voucher plan deactivated successfully.', data: plan });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.VoucherPlanController = VoucherPlanController;
