// server/src/controllers/authController.ts

// Express HTTP request handlers delegating authentication operations to authService.

import { Request, Response, NextFunction } from 'express';
import {
  AuthServiceError,
  registerUser,
  verifyUserOtp,
  resendUserOtp,
  loginUser,
  refreshUserSession,
  logoutUser,
  requestPasswordReset,
  resetUserPassword,
} from '../services/authService.js';
import { loginWithGoogle } from '../services/googleAuthService.js';
import {
  RegisterInput,
  VerifyOtpInput,
  ResendOtpInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  GoogleAuthInput,
} from '../schemas/authSchemas.js';

/**
 * Handles known service errors with appropriate HTTP status codes or delegates to next().
 */
const handleAuthError = (error: unknown, res: Response, next: NextFunction): void => {
  if (error instanceof AuthServiceError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      ...(error.details || {}),
    });
    return;
  }
  next(error);
};

export const register = async (
  req: Request<unknown, unknown, RegisterInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { isNew, email } = await registerUser(req.body);
    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew
        ? 'Registration successful. Please verify your email with the 6-digit code.'
        : 'Account pending verification. A new verification code was sent to your email.',
      email,
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
};

export const verifyOtpHandler = async (
  req: Request<unknown, unknown, VerifyOtpInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await verifyUserOtp(req.body);
    res.status(200).json({
      success: true,
      message: 'Account verified successfully.',
      ...session,
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
};

export const resendOtp = async (
  req: Request<unknown, unknown, ResendOtpInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await resendUserOtp(req.body.email);
    res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
};

export const login = async (
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await loginUser(req.body);
    res.status(200).json({
      success: true,
      message: 'Sign in successful.',
      ...session,
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
};

export const refresh = async (
  req: Request<unknown, unknown, RefreshTokenInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tokens = await refreshUserSession(req.body.refreshToken);
    res.status(200).json({
      success: true,
      ...tokens,
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await logoutUser(req.user?.userId, req.body?.refreshToken);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
};

export const forgotPassword = async (
  req: Request<unknown, unknown, ForgotPasswordInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await requestPasswordReset(req.body.email);
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.',
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
};

export const resetPassword = async (
  req: Request<unknown, unknown, ResetPasswordInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await resetUserPassword(req.body);
    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please sign in with your new password.',
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
};

export const googleAuth = async (
  req: Request<unknown, unknown, GoogleAuthInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await loginWithGoogle(req.body.credential);
    res.status(200).json({
      success: true,
      message: 'Google authentication successful.',
      ...session,
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
};
