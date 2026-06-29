
import './middlewares/auth.middleware.js';
import { AdminCustomerController } from './controllers/adminCustomer.controller.js';
import { AdminController } from './controllers/admin.controller.js';
import { Request, Response, NextFunction } from 'express';

// Mock request and response objects
const req = {} as Request;
const res = {
  status: (code: number) => {
    console.log(`Response Status: ${code}`);
    return {
      json: (data: any) => {
        console.log("Response JSON status:", data.success);
      }
    };
  }
} as Response;

const next: NextFunction = (err: any) => {
  if (err) {
    console.error("Express Error:", err);
  }
};

async function testAll() {
  console.log("================= CUSTOMER INTELLIGENCE =================");
  try {
    await AdminCustomerController.getCustomerIntelligence(req, res, next);
  } catch (err) {
    console.error(err);
  }

  console.log("================= ORDER INTELLIGENCE =================");
  try {
    await AdminController.getOrderIntelligence(req, res, next);
  } catch (err) {
    console.error(err);
  }

  console.log("================= REVENUE INTELLIGENCE =================");
  try {
    await AdminController.getRevenueIntelligence(req, res, next);
  } catch (err) {
    console.error(err);
  }

  console.log("================= PROMOTIONS INTELLIGENCE =================");
  try {
    await AdminController.getPromotionsIntelligence(req, res, next);
  } catch (err) {
    console.error(err);
  }

  console.log("================= INVENTORY INTELLIGENCE =================");
  try {
    await AdminController.getInventoryIntelligence(req, res, next);
  } catch (err) {
    console.error(err);
  }
}

testAll();
