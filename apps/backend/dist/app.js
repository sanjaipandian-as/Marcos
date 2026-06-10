"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const index_js_1 = __importDefault(require("./routes/index.js"));
const error_middleware_js_1 = __importDefault(require("./middlewares/error.middleware.js"));
const rateLimit_middleware_js_1 = require("./middlewares/rateLimit.middleware.js");
const app = (0, express_1.default)();
exports.app = app;
// 1. Webhook Raw Body Preservation (must run BEFORE express.json())
app.use('/api/v1/billing/webhook', express_1.default.raw({ type: 'application/json' }));
// 2. Security & Parsing Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false, // Allow local uploads to be requested by different domains
}));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, postman, curl)
        if (!origin)
            return callback(null, true);
        // Allow any localhost origin or your staging/production domains
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }
        // For other origins, you can restrict or allow them. Let's allow for development flexibility.
        return callback(null, true);
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use((0, cookie_parser_1.default)());
// 3. Rate limiting (global)
app.use(rateLimit_middleware_js_1.globalRateLimiter);
// 4. Local Uploads Static Folder
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// 5. Main Route Combine
app.use('/api/v1', index_js_1.default);
// 6. Global Error Middleware
app.use(error_middleware_js_1.default);
exports.default = app;
