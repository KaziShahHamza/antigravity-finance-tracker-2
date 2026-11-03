// server/src/controllers/authController.ts

// Request handlers for email/password registration, OTP verification, login, refresh, and logout.

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateOtp,
  hashOtp,
  verifyOtp,
} from '../utils/tokenUtils.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { seedUserDefaults } from '../services/seedService.js';
import {
  RegisterInput,
  VerifyOtpInput,
  ResendOtpInput,
  LoginInput,
  RefreshTokenInput,
} from '../schemas/authSchemas.js';

const OTP_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

/**
 * Register a new user with email and password, issuing a 6-digit verification code.
 */
export const register = async (
  req: Request<unknown, unknown, RegisterInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, defaultCurrency } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
          code: 'EMAIL_ALREADY_EXISTS',
        });
        return;
      }

      // If user exists but is unverified, refresh their registration & OTP
      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = generateOtp();
      const otpHash = hashOtp(otp);

      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.defaultCurrency = defaultCurrency || 'USD';
      existingUser.verificationOtpHash = otpHash;
      existingUser.verificationOtpExpiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);
      existingUser.resendCooldownUntil = new Date(Date.now() + RESEND_COOLDOWN_MS);

      await existingUser.save();
      await sendVerificationEmail(existingUser.email, otp);

      res.status(200).json({
        success: true,
        message: 'Account pending verification. A new verification code was sent to your email.',
        email: existingUser.email,
      });
      return;
    }

    // New user signup
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      defaultCurrency: defaultCurrency || 'USD',
      isVerified: false,
      verificationOtpHash: otpHash,
      verificationOtpExpiresAt: new Date(Date.now() + OTP_EXPIRATION_MS),
      resendCooldownUntil: new Date(Date.now() + RESEND_COOLDOWN_MS),
    });

    await sendVerificationEmail(newUser.email, otp);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the 6-digit code.',
      email: newUser.email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify account using 6-digit OTP, seed onboarding defaults, and issue session tokens.
 */
export const verifyOtpHandler = async (
  req: Request<unknown, unknown, VerifyOtpInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        message: 'Account is already verified. Please sign in.',
        code: 'ALREADY_VERIFIED',
      });
      return;
    }

    if (!user.verificationOtpHash || !user.verificationOtpExpiresAt) {
      res.status(400).json({
        success: false,
        message: 'No pending verification code found. Please request a new code.',
        code: 'NO_PENDING_OTP',
      });
      return;
    }

    // Check expiration
    if (new Date() > user.verificationOtpExpiresAt) {
      res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
        code: 'OTP_EXPIRED',
      });
      return;
    }

    // Verify OTP hash
    if (!verifyOtp(otp, user.verificationOtpHash)) {
      res.status(400).json({
        success: false,
        message: 'Invalid verification code.',
        code: 'INVALID_OTP',
      });
      return;
    }

    // Mark verified and clear OTP fields
    user.isVerified = true;
    user.verificationOtpHash = undefined;
    user.verificationOtpExpiresAt = undefined;
    user.resendCooldownUntil = undefined;

    // Issue access and refresh tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
    });

    user.refreshTokenHash = hashOtp(refreshToken);
    await user.save();

    // Idempotently seed onboarding defaults (12 categories + Main Checking account)
    await seedUserDefaults(user._id, user.defaultCurrency);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        defaultCurrency: user.defaultCurrency,
        themePreference: user.themePreference,
        avatarUrl: user.avatarUrl,
        isVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend a new 6-digit verification code subject to 60-second cooldown.
 */
export const resendOtp = async (
  req: Request<unknown, unknown, ResendOtpInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        message: 'Account is already verified.',
        code: 'ALREADY_VERIFIED',
      });
      return;
    }

    // Enforce 60-second cooldown
    if (user.resendCooldownUntil && new Date() < user.resendCooldownUntil) {
      const waitSeconds = Math.ceil((user.resendCooldownUntil.getTime() - Date.now()) / 1000);
      res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
        code: 'RESEND_COOLDOWN',
        retryAfterSeconds: waitSeconds,
      });
      return;
    }

    const otp = generateOtp();
    user.verificationOtpHash = hashOtp(otp);
    user.verificationOtpExpiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);
    user.resendCooldownUntil = new Date(Date.now() + RESEND_COOLDOWN_MS);

    await user.save();
    await sendVerificationEmail(user.email, otp);

    res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sign in with email and password, issuing access and refresh tokens.
 */
export const login = async (
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email address to access your dashboard.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
      return;
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
    });

    user.refreshTokenHash = hashOtp(refreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Sign in successful.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        defaultCurrency: user.defaultCurrency,
        themePreference: user.themePreference,
        avatarUrl: user.avatarUrl,
        isVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Silent renewal of session tokens using a valid refresh token.
 */
export const refresh = async (
  req: Request<unknown, unknown, RefreshTokenInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
        code: 'INVALID_REFRESH_TOKEN',
      });
      return;
    }

    const user = await User.findById(payload.userId);

    if (!user || !user.refreshTokenHash) {
      res.status(401).json({
        success: false,
        message: 'Session has ended or token has been revoked.',
        code: 'REVOKED_REFRESH_TOKEN',
      });
      return;
    }

    // Verify token hash against active token stored in DB
    if (!verifyOtp(refreshToken, user.refreshTokenHash)) {
      res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked.',
        code: 'REVOKED_REFRESH_TOKEN',
      });
      return;
    }

    // Rotate tokens
    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });
    const newRefreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
    });

    user.refreshTokenHash = hashOtp(newRefreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate active session and invalidate stored refresh token.
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { refreshToken } = req.body || {};

    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    } else if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await User.findByIdAndUpdate(payload.userId, { refreshTokenHash: null });
      } catch {
        // If token is invalid or expired, session is already dead
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};
