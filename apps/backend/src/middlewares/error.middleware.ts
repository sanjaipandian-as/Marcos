import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

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

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    ...(err.details && { details: err.details }),
  });
}

export default errorMiddleware;
