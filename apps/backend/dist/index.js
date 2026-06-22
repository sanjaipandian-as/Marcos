"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_js_1 = __importDefault(require("./app.js"));
const env_js_1 = __importDefault(require("./config/env.js"));
const logger_js_1 = __importDefault(require("./utils/logger.js"));
const socket_handler_js_1 = require("./socket/socket.handler.js");
const jobs_worker_js_1 = require("./queues/jobs.worker.js");
const analytics_worker_js_1 = require("./services/analytics.worker.js");
const db_js_1 = __importDefault(require("./config/db.js"));
const redis_js_1 = __importDefault(require("./config/redis.js"));
const server = http_1.default.createServer(app_js_1.default);
// 1. Initialize Real-Time WebSockets
(0, socket_handler_js_1.initSocket)(server);
// 2. Initialize Background Task Workers
(0, jobs_worker_js_1.initWorker)();
(0, analytics_worker_js_1.startAnalyticsFlushWorker)();
const port = env_js_1.default.PORT;
server.listen(port, () => {
    logger_js_1.default.info(`🚀 MARCOS Backend Engine running in ${env_js_1.default.NODE_ENV} mode on port ${port}`);
});
// Graceful shutdown handler
async function gracefulShutdown(signal) {
    logger_js_1.default.info(`${signal} received. Starting graceful shutdown...`);
    // 1. Stop accepting new connections
    server.close(() => {
        logger_js_1.default.info('HTTP server closed. No new connections accepted.');
    });
    try {
        // 2. Close database connection pool
        await db_js_1.default.$disconnect();
        logger_js_1.default.info('Prisma database connection closed.');
    }
    catch (err) {
        logger_js_1.default.error('Error closing Prisma connection:', { metadata: { error: err.message } });
    }
    try {
        // 3. Close Redis connection
        redis_js_1.default.disconnect();
        logger_js_1.default.info('Redis connection closed.');
    }
    catch (err) {
        logger_js_1.default.error('Error closing Redis connection:', { metadata: { error: err.message } });
    }
    // 4. Allow a short grace period for in-flight requests, then exit
    setTimeout(() => {
        logger_js_1.default.info('Graceful shutdown complete. Exiting.');
        process.exit(0);
    }, 3000);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
    logger_js_1.default.error('Unhandled Rejection at Promise', { metadata: { reason, promise } });
});
process.on('uncaughtException', (error) => {
    logger_js_1.default.error('Uncaught Exception thrown', { metadata: { error: error.message, stack: error.stack } });
    gracefulShutdown('uncaughtException');
});
