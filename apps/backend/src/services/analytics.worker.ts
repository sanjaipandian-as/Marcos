import redis from '../config/redis.js';
import prisma from '../config/db.js';
import logger from '../utils/logger.js';
import { isDevelopment } from '../config/environment.js';

const CHUNK_SIZE = 5000;

export function startAnalyticsFlushWorker() {
  if (isDevelopment) {
    logger.info('Background Analytics Flush Worker disabled in development to save Redis limits.');
    return;
  }
  logger.info('Background Analytics Flush Worker started.');

  // Run the flush job every 60 seconds to batch analytics writes efficiently
  setInterval(async () => {
    try {
      let totalProcessed = 0;

      while (true) {
        // Check how many items are in the list FIRST (1 command instead of 5000)
        const listLength = await redis.llen('analytics:events');
        if (listLength === 0) break;

        // Only pop the exact number of items available, capped at CHUNK_SIZE
        const popCount = Math.min(listLength, CHUNK_SIZE);
        const pipeline = redis.pipeline();
        for (let i = 0; i < popCount; i++) {
          pipeline.lpop('analytics:events');
        }

        const results = await pipeline.exec();
        if (!results) break;

        const events = results
          .map(([err, res]: [any, any]) => res)
          .filter((res: any): res is string => typeof res === 'string')
          .map((val: string) => JSON.parse(val));

        if (events.length === 0) {
          break; // No more items to process in the Redis list
        }

        // Bulk insert this chunk into PostgreSQL
        await prisma.analyticsEvent.createMany({
          data: events.map((e: any) => ({
            eventType: e.eventType,
            productId: e.productId || null,
            userId: e.userId || null,
            createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
          })),
        });

        totalProcessed += events.length;

        // If we popped fewer items than the CHUNK_SIZE, the list has been drained
        if (events.length < CHUNK_SIZE) {
          break;
        }
      }

      if (totalProcessed > 0) {
        logger.info(`✓ Analytics Flush: Successfully bulk inserted ${totalProcessed} events into PostgreSQL.`);
      }
    } catch (error: any) {
      logger.error('Error flushing analytics events:', { metadata: { error: error.message } });
    }
  }, 60000); // 60 seconds interval
}

