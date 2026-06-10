import http from 'http';
import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import { initSocket } from './socket/socket.handler.js';
import { initWorker } from './queues/jobs.worker.js';

const server = http.createServer(app);

// 1. Initialize Real-Time WebSockets
initSocket(server);

// 2. Initialize Background Task Workers
initWorker();

const port = env.PORT;
server.listen(port, () => {
  logger.info(`🚀 MARCOS Backend Engine running in ${env.NODE_ENV} mode on port ${port}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at Promise', { metadata: { reason, promise } });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown', { metadata: { error: error.message, stack: error.stack } });
  process.exit(1);
});
// Trigger nodemon reload (Port cleared and restarted).
