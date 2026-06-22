import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import router from './routes/index.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { globalRateLimiter } from './middlewares/rateLimit.middleware.js';
import env from './config/env.js';
import logger from './utils/logger.js';

const app = express();

// Custom HTTP request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      metadata: {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
        ip: req.ip,
      },
    });
  });
  next();
});

// 1. Webhook Raw Body Preservation (must run BEFORE express.json())
app.use('/api/v1/billing/webhook', express.raw({ type: 'application/json' }));

// 2. Security & Parsing Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow local uploads to be requested by different domains
}));
const allowedOrigins = env.ALLOWED_ORIGINS
  ? env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    // Allow any localhost origin in development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    // Allow configured production origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Reject other origins
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(cookieParser());

// 3. Rate limiting (global)
app.use(globalRateLimiter);

// 4. Local Uploads Static Folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 5. Main Route Combine
app.use('/api/v1', router);

// 6. Global Error Middleware
app.use(errorMiddleware);

export { app };
export default app;
