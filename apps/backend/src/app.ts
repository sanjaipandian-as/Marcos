import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import router from './routes/index.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { globalRateLimiter } from './middlewares/rateLimit.middleware.js';
import env from './config/env.js';
import { isProduction, mode } from './config/environment.js';
import logger from './utils/logger.js';

const app = express();

// 0. Response Compression (gzip/deflate for payloads > 1KB)
app.use(compression({ threshold: 1024 }));

// Custom HTTP request logger middleware
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/uploads') || req.originalUrl === '/') {
    return next();
  }
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

// Known production origins — always permitted regardless of env var
const PRODUCTION_ORIGINS = [
  'https://marcos-admin-panel.vercel.app',
  'https://marcos.app',
];

// Merge with any extra origins supplied via ALLOWED_ORIGINS env var
const extraOrigins = env.ALLOWED_ORIGINS
  ? env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...new Set([...PRODUCTION_ORIGINS, ...extraOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, Render health checks)
    if (!origin) return callback(null, true);
    // Allow any localhost / 127.0.0.1 origin ONLY in development
    if (!isProduction) {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    // Allow all known production origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Reject everything else
    return callback(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(cookieParser());

// 3. Rate limiting (global)
app.use(globalRateLimiter);

// 4. Local Uploads Static Folder with Cache-Control headers
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

// 5. Root health-check route — open, no auth required
app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MARCOS — Backend Engine</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background: #0a0a0f;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    /* Ambient background blobs */
    body::before, body::after {
      content: '';
      position: fixed;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.25;
      pointer-events: none;
    }
    body::before {
      width: 600px; height: 600px;
      background: radial-gradient(circle, #6c3de8, transparent);
      top: -200px; left: -200px;
      animation: drift1 12s ease-in-out infinite alternate;
    }
    body::after {
      width: 500px; height: 500px;
      background: radial-gradient(circle, #1a6cf5, transparent);
      bottom: -150px; right: -150px;
      animation: drift2 10s ease-in-out infinite alternate;
    }

    @keyframes drift1 { from { transform: translate(0,0); } to { transform: translate(60px, 40px); } }
    @keyframes drift2 { from { transform: translate(0,0); } to { transform: translate(-50px, -30px); } }

    .card {
      position: relative;
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 56px 64px;
      text-align: center;
      max-width: 520px;
      width: 90%;
      box-shadow: 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
      animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(32px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .logo-ring {
      width: 80px; height: 80px;
      margin: 0 auto 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6c3de8 0%, #1a6cf5 100%);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 12px rgba(108,61,232,0.12), 0 0 40px rgba(108,61,232,0.4);
      animation: pulse 3s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 12px rgba(108,61,232,0.12), 0 0 40px rgba(108,61,232,0.4); }
      50%       { box-shadow: 0 0 0 20px rgba(108,61,232,0.06), 0 0 60px rgba(108,61,232,0.6); }
    }
    .logo-ring svg { width: 36px; height: 36px; fill: #fff; }

    h1 {
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #fff 30%, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }

    .tagline {
      font-size: 0.95rem;
      color: #94a3b8;
      font-weight: 400;
      margin-bottom: 40px;
      letter-spacing: 0.3px;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(34,197,94,0.12);
      border: 1px solid rgba(34,197,94,0.3);
      border-radius: 999px;
      padding: 6px 18px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #4ade80;
      margin-bottom: 40px;
    }
    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 8px #4ade80;
      animation: blink 1.6s ease-in-out infinite;
    }
    @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 40px;
    }
    .meta-item {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 16px;
    }
    .meta-label {
      font-size: 0.72rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .meta-value {
      font-size: 0.95rem;
      font-weight: 600;
      color: #e2e8f0;
    }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
      margin-bottom: 28px;
    }

    .footer {
      font-size: 0.78rem;
      color: #475569;
    }
    .footer span { color: #6c3de8; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-ring">
      <!-- Minimalist "M" bolt icon -->
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2 L13 2 L9 10 L14 10 L7 22 L11 13 L6 13 Z"/>
      </svg>
    </div>

    <h1>MARCOS</h1>
    <p class="tagline">Backend Engine · REST API &amp; WebSocket Server</p>

    <div class="status-pill">
      <span class="dot"></span>
      All Systems Operational
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Environment</div>
        <div class="meta-value">${mode}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">API Base</div>
        <div class="meta-value">/api/v1</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Uptime</div>
        <div class="meta-value">${Math.floor(process.uptime())}s</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Node</div>
        <div class="meta-value">${process.version}</div>
      </div>
    </div>

    <div class="divider"></div>
    <p class="footer">Powered by <span>MARCOS Studio</span> &copy; ${new Date().getFullYear()}</p>
  </div>
</body>
</html>`);
});

// 6. Main Route Combine
app.use('/api/v1', router);


// 6. Global Error Middleware
app.use(errorMiddleware);

export { app };
export default app;
