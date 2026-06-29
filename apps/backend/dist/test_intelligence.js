"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./middlewares/auth.middleware.js");
const adminCustomer_controller_js_1 = require("./controllers/adminCustomer.controller.js");
const admin_controller_js_1 = require("./controllers/admin.controller.js");
// Mock request and response objects
const req = {};
const res = {
    status: (code) => {
        console.log(`Response Status: ${code}`);
        return {
            json: (data) => {
                console.log("Response JSON status:", data.success);
            }
        };
    }
};
const next = (err) => {
    if (err) {
        console.error("Express Error:", err);
    }
};
async function testAll() {
    console.log("================= CUSTOMER INTELLIGENCE =================");
    try {
        await adminCustomer_controller_js_1.AdminCustomerController.getCustomerIntelligence(req, res, next);
    }
    catch (err) {
        console.error(err);
    }
    console.log("================= ORDER INTELLIGENCE =================");
    try {
        await admin_controller_js_1.AdminController.getOrderIntelligence(req, res, next);
    }
    catch (err) {
        console.error(err);
    }
    console.log("================= REVENUE INTELLIGENCE =================");
    try {
        await admin_controller_js_1.AdminController.getRevenueIntelligence(req, res, next);
    }
    catch (err) {
        console.error(err);
    }
    console.log("================= PROMOTIONS INTELLIGENCE =================");
    try {
        await admin_controller_js_1.AdminController.getPromotionsIntelligence(req, res, next);
    }
    catch (err) {
        console.error(err);
    }
    console.log("================= INVENTORY INTELLIGENCE =================");
    try {
        await admin_controller_js_1.AdminController.getInventoryIntelligence(req, res, next);
    }
    catch (err) {
        console.error(err);
    }
}
testAll();
