"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureCookieOptions = exports.isDevOrTest = exports.isTest = exports.isDevelopment = exports.isProduction = exports.mode = void 0;
/**
 * Centralized Environment Mode Helpers
 *
 * Single source of truth for environment checks.
 * Change `NODE_ENV` in `.env` once → entire codebase responds.
 *
 * Usage:
 *   import { isProduction, isDevelopment, isTest, mode } from '../config/environment.js';
 *
 *   if (isProduction) { ... }   // instead of process.env.NODE_ENV === 'production'
 *   if (isDevelopment) { ... }  // instead of env.NODE_ENV === 'development'
 */
const env_js_1 = __importDefault(require("./env.js"));
/** Current environment mode string */
exports.mode = env_js_1.default.NODE_ENV;
/** true when NODE_ENV === 'production' */
exports.isProduction = exports.mode === 'production';
/** true when NODE_ENV === 'development' */
exports.isDevelopment = exports.mode === 'development';
/** true when NODE_ENV === 'test' */
exports.isTest = exports.mode === 'test';
/** true when NOT in production (development OR test) */
exports.isDevOrTest = exports.isDevelopment || exports.isTest;
/** Cookie options that auto-adapt to the current environment */
exports.secureCookieOptions = {
    path: '/',
    httpOnly: true,
    secure: exports.isProduction,
    sameSite: (exports.isProduction ? 'strict' : 'lax'),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
exports.default = { mode: exports.mode, isProduction: exports.isProduction, isDevelopment: exports.isDevelopment, isTest: exports.isTest, isDevOrTest: exports.isDevOrTest, secureCookieOptions: exports.secureCookieOptions };
