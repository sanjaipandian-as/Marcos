import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { isProduction } from '../config/environment.js';

export interface CustomError extends Error {
  statusCode?: number;
  details?: any;
}

export function errorMiddleware(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error(`${req.method} ${req.originalUrl} - Error: ${message}`, {
    metadata: {
      stack: err.stack,
      details: err.details,
      statusCode,
    },
  });

  let cleanMessage = message;

  if (isProduction) {
    if (statusCode === 500) {
      cleanMessage = 'Internal Server Error';
    }
    // Filter out detailed Prisma/SQL errors
    if (err.name?.startsWith('Prisma') || err.message?.includes('prisma') || err.message?.includes('Database')) {
      cleanMessage = 'A database conflict or constraint occurred. Access denied.';
    }
  }

  res.status(statusCode).json({
    success: false,
    message: cleanMessage,
    ...(!isProduction && { stack: err.stack }),
    ...(!isProduction && err.details && { details: err.details }),
  });
}

export default errorMiddleware;

