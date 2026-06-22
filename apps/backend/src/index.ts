import http from 'http';
import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import { initSocket } from './socket/socket.handler.js';
import { initWorker } from './queues/jobs.worker.js';
import { startAnalyticsFlushWorker } from './services/analytics.worker.js';
import prisma from './config/db.js';
import redis from './config/redis.js';

const server = http.createServer(app);

// 1. Initialize Real-Time WebSockets
initSocket(server);

// 2. Initialize Background Task Workers
initWorker();
startAnalyticsFlushWorker();

const port = env.PORT;
server.listen(port, () => {
  logger.info(`🚀 MARCOS Backend Engine running in ${env.NODE_ENV} mode on port ${port}`);
});

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // 1. Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed. No new connections accepted.');
  });

  try {
    // 2. Close database connection pool
    await prisma.$disconnect();
    logger.info('Prisma database connection closed.');
  } catch (err: any) {
    logger.error('Error closing Prisma connection:', { metadata: { error: err.message } });
  }

  try {
    // 3. Close Redis connection
    redis.disconnect();
    logger.info('Redis connection closed.');
  } catch (err: any) {
    logger.error('Error closing Redis connection:', { metadata: { error: err.message } });
  }

  // 4. Allow a short grace period for in-flight requests, then exit
  setTimeout(() => {
    logger.info('Graceful shutdown complete. Exiting.');
    process.exit(0);
  }, 3000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at Promise', { metadata: { reason, promise } });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown', { metadata: { error: error.message, stack: error.stack } });
  gracefulShutdown('uncaughtException');
});

