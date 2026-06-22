import { Router } from 'express';
import prisma from '../config/db.js';
import redis from '../config/redis.js';

const router = Router();

router.get('/health', async (req, res) => {
  const healthStatus: any = {
    status: 'UP',
    timestamp: new Date(),
    services: {
      database: 'DOWN',
      redis: 'DOWN',
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.database = 'UP';
  } catch (dbError: any) {
    healthStatus.status = 'DEGRADED';
    healthStatus.services.database = `DOWN: ${dbError.message}`;
  }

  try {
    const pingResult = await redis.ping();
    if (pingResult === 'PONG') {
      healthStatus.services.redis = 'UP';
    } else {
      healthStatus.status = 'DEGRADED';
      healthStatus.services.redis = `DOWN: Unexpected ping response ${pingResult}`;
    }
  } catch (redisError: any) {
    healthStatus.status = 'DEGRADED';
    healthStatus.services.redis = `DOWN: ${redisError.message}`;
  }

  const statusCode = healthStatus.status === 'UP' ? 200 : 500;
  return res.status(statusCode).json(healthStatus);
});

router.get('/settings/public', async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
