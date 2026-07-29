import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import { isProduction } from './environment.js';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

// Log slow queries (>200ms)
(prisma as any).$on('query', (e: any) => {
  if (e.duration >= 200) {
    logger.warn(`🐌 Slow Query (${e.duration}ms): ${e.query} | Params: [REDACTED]`);
  }
});

if (!isProduction) {
  globalThis.prisma = prisma;
}

export default prisma;

