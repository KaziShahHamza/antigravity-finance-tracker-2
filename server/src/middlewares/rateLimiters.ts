// server/src/middlewares/rateLimiters.ts

// Security rate limiters to protect authentication endpoints from brute-force attacks.

import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Standard auth rate limiter for login and registration attempts.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  skip: () => env.NODE_ENV === 'test',
});

/**
 * Strict rate limiter for OTP verification and generation.
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification code requests, please try again after 15 minutes.',
  },
  skip: () => env.NODE_ENV === 'test',
});

/**
 * Rate limiter for AI receipt scanning and OCR extraction.
 */
export const ocrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many receipt scans, please try again after 15 minutes.',
  },
  skip: () => env.NODE_ENV === 'test',
});
