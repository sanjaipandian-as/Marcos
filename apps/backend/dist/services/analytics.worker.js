"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAnalyticsFlushWorker = startAnalyticsFlushWorker;
const redis_js_1 = __importDefault(require("../config/redis.js"));
const db_js_1 = __importDefault(require("../config/db.js"));
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const CHUNK_SIZE = 2000;
function startAnalyticsFlushWorker() {
    logger_js_1.default.info('Background Analytics Flush Worker started.');
    // Run the flush job every 5 minutes (300 seconds) to conserve Redis commands
    setInterval(async () => {
        try {
            let totalProcessed = 0;
            while (true) {
                // Check how many items are in the list FIRST (1 command instead of 2000)
                const listLength = await redis_js_1.default.llen('analytics:events');
                if (listLength === 0)
                    break;
                // Only pop the exact number of items available, capped at CHUNK_SIZE
                const popCount = Math.min(listLength, CHUNK_SIZE);
                const pipeline = redis_js_1.default.pipeline();
                for (let i = 0; i < popCount; i++) {
                    pipeline.lpop('analytics:events');
                }
                const results = await pipeline.exec();
                if (!results)
                    break;
                const events = results
                    .map(([err, res]) => res)
                    .filter((res) => typeof res === 'string')
                    .map((val) => JSON.parse(val));
                if (events.length === 0) {
                    break; // No more items to process in the Redis list
                }
                // Bulk insert this chunk into PostgreSQL
                await db_js_1.default.analyticsEvent.createMany({
                    data: events.map((e) => ({
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
                logger_js_1.default.info(`✓ Analytics Flush: Successfully bulk inserted ${totalProcessed} events into PostgreSQL.`);
            }
        }
        catch (error) {
            logger_js_1.default.error('Error flushing analytics events:', { metadata: { error: error.message } });
        }
    }, 5000); // 5 seconds interval (was 5 minutes)
}
