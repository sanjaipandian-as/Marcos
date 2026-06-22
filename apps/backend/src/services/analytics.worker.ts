import redis from '../config/redis.js';
import prisma from '../config/db.js';
import logger from '../utils/logger.js';

const CHUNK_SIZE = 2000;

export function startAnalyticsFlushWorker() {
  logger.info('Background Analytics Flush Worker started.');

  // Run the flush job every 5 minutes (300 seconds) to conserve Redis commands
  setInterval(async () => {
    try {
      let totalProcessed = 0;

      while (true) {
        // Check how many items are in the list FIRST (1 command instead of 2000)
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
          .map(([err, res]) => res)
          .filter((res): res is string => typeof res === 'string')
          .map((val) => JSON.parse(val));

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
  }, 300000); // 5 minutes interval (was 60 seconds)
}

