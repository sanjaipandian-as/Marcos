"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().url(),
    JWT_ACCESS_SECRET: zod_1.z.string().min(8),
    JWT_REFRESH_SECRET: zod_1.z.string().min(8),
    ALLOWED_ORIGINS: zod_1.z.string().default(''),
    // Cloudflare R2
    CLOUDFLARE_R2_ACCESS_KEY: zod_1.z.string().optional(),
    CLOUDFLARE_R2_SECRET_KEY: zod_1.z.string().optional(),
    CLOUDFLARE_R2_BUCKET: zod_1.z.string().optional(),
    CLOUDFLARE_R2_ENDPOINT: zod_1.z.string().optional(),
    // SendGrid
    SENDGRID_API_KEY: zod_1.z.string().optional(),
    // Twilio
    TWILIO_ACCOUNT_SID: zod_1.z.string().optional(),
    TWILIO_AUTH_TOKEN: zod_1.z.string().optional(),
    TWILIO_PHONE_NUMBER: zod_1.z.string().optional(),
    // SMTP Settings
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().optional(),
    // Webhooks & Gateways
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: zod_1.z.string().optional(),
    // Firebase Configuration
    FIREBASE_PROJECT_ID: zod_1.z.string().optional(),
    FIREBASE_CLIENT_EMAIL: zod_1.z.string().optional(),
    FIREBASE_PRIVATE_KEY: zod_1.z.string().optional(),
    // Security Keys (AES-256-GCM encryption key)
    // Must be 32 bytes (64 hex characters or 32 chars)
    ENCRYPTION_KEY: zod_1.z.string().default('a'.repeat(32)),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
exports.default = exports.env;
