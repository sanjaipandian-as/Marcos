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
import env from './env.js';

/** Current environment mode string */
export const mode = env.NODE_ENV;

/** true when NODE_ENV === 'production' */
export const isProduction = mode === 'production';

/** true when NODE_ENV === 'development' */
export const isDevelopment = mode === 'development';

/** true when NODE_ENV === 'test' */
export const isTest = mode === 'test';

/** true when NOT in production (development OR test) */
export const isDevOrTest = isDevelopment || isTest;

/** Cookie options that auto-adapt to the current environment */
export const secureCookieOptions = {
  path: '/',
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'strict' : 'lax') as 'strict' | 'lax' | 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export default { mode, isProduction, isDevelopment, isTest, isDevOrTest, secureCookieOptions };
