"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = __importDefault(require("../config/db.js"));
const redis_js_1 = __importDefault(require("../config/redis.js"));
const router = (0, express_1.Router)();
router.get('/health', async (req, res) => {
    const healthStatus = {
        status: 'UP',
        timestamp: new Date(),
        services: {
            database: 'DOWN',
            redis: 'DOWN',
        },
    };
    try {
        await db_js_1.default.$queryRaw `SELECT 1`;
        healthStatus.services.database = 'UP';
    }
    catch (dbError) {
        healthStatus.status = 'DEGRADED';
        healthStatus.services.database = `DOWN: ${dbError.message}`;
    }
    try {
        const pingResult = await redis_js_1.default.ping();
        if (pingResult === 'PONG') {
            healthStatus.services.redis = 'UP';
        }
        else {
            healthStatus.status = 'DEGRADED';
            healthStatus.services.redis = `DOWN: Unexpected ping response ${pingResult}`;
        }
    }
    catch (redisError) {
        healthStatus.status = 'DEGRADED';
        healthStatus.services.redis = `DOWN: ${redisError.message}`;
    }
    const statusCode = healthStatus.status === 'UP' ? 200 : 500;
    return res.status(statusCode).json(healthStatus);
});
router.get('/settings/public', async (req, res) => {
    try {
        let settings = await db_js_1.default.systemSettings.findUnique({
            where: { id: 'default' }
        });
        if (!settings) {
            settings = await db_js_1.default.systemSettings.create({
                data: {
                    id: 'default'
                }
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                businessHoursStart: settings.businessHoursStart,
                businessHoursEnd: settings.businessHoursEnd,
                bookingSlotDurationMinutes: settings.bookingSlotDurationMinutes,
                maxBookingsPerSlot: settings.maxBookingsPerSlot
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
