"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const logger_js_1 = __importDefault(require("../utils/logger.js"));
function errorMiddleware(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    logger_js_1.default.error(`${req.method} ${req.originalUrl} - Error: ${message}`, {
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
exports.default = errorMiddleware;
