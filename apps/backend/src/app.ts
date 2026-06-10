import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import router from './routes/index.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { globalRateLimiter } from './middlewares/rateLimit.middleware.js';

const app = express();

// 1. Webhook Raw Body Preservation (must run BEFORE express.json())
app.use('/api/v1/billing/webhook', express.raw({ type: 'application/json' }));

// 2. Security & Parsing Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow local uploads to be requested by different domains
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    // Allow any localhost origin or your staging/production domains
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    // For other origins, you can restrict or allow them. Let's allow for development flexibility.
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
