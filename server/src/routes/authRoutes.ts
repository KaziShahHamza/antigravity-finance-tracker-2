// server/src/routes/authRoutes.ts

// Express router configuring endpoints and validation middlewares for authentication.

import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.js';
import { authLimiter, otpLimiter } from '../middlewares/rateLimiters.js';
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
} from '../schemas/authSchemas.js';
import {
  register,
  verifyOtpHandler,
  resendOtp,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  googleAuth,
} from '../controllers/authController.js';

const router = Router();

// Registration & OTP verification
router.post('/register', authLimiter, validateRequest({ body: registerSchema }), register);

router.post(
  '/verify-otp',
  otpLimiter,
  validateRequest({ body: verifyOtpSchema }),
  verifyOtpHandler
);

router.post('/resend-otp', otpLimiter, validateRequest({ body: resendOtpSchema }), resendOtp);

// Session management
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), login);

router.post('/refresh', validateRequest({ body: refreshTokenSchema }), refresh);

router.post('/logout', logout);

// Password recovery
router.post(
  '/forgot-password',
  authLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validateRequest({ body: resetPasswordSchema }),
  resetPassword
);

// Google OAuth
router.post('/google', authLimiter, validateRequest({ body: googleAuthSchema }), googleAuth);

export default router;
