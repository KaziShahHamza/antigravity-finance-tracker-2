// server/src/services/authService.ts

// Core authentication service managing user registration, OTP verification, password login, and session tokens.

import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateOtp,
  hashOtp,
  verifyOtp,
} from '../utils/tokenUtils.js';
import { sendVerificationEmail } from './emailService.js';
import { seedUserDefaults } from './seedService.js';
import { RegisterInput, VerifyOtpInput, LoginInput } from '../schemas/authSchemas.js';

const OTP_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

export interface UserSessionResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: unknown;
    name: string;
    email: string;
    defaultCurrency: string;
    themePreference: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
}

/**
 * Issues signed access and refresh tokens, updates stored token hash, and formats user DTO.
 */
export const issueUserSession = async (user: IUser): Promise<UserSessionResult> => {
  const userId = user._id.toString();
  const accessToken = generateAccessToken({ userId, email: user.email });
  const refreshToken = generateRefreshToken({ userId, email: user.email });

  user.refreshTokenHash = hashOtp(refreshToken);
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      defaultCurrency: user.defaultCurrency,
      themePreference: user.themePreference,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
    },
  };
};

/**
 * Registers a new user or re-triggers OTP for existing unverified accounts.
 */
export const registerUser = async (
  input: RegisterInput
): Promise<{ isNew: boolean; email: string }> => {
  const { name, email, password, defaultCurrency } = input;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.isVerified) {
      throw new AuthServiceError(
        'An account with this email address already exists.',
        409,
        'EMAIL_ALREADY_EXISTS'
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    existingUser.name = name;
    existingUser.password = hashedPassword;
    existingUser.defaultCurrency = defaultCurrency || 'USD';
    existingUser.verificationOtpHash = hashOtp(otp);
    existingUser.verificationOtpExpiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);
    existingUser.resendCooldownUntil = new Date(Date.now() + RESEND_COOLDOWN_MS);

    await existingUser.save();
    await sendVerificationEmail(existingUser.email, otp);

    return { isNew: false, email: existingUser.email };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    defaultCurrency: defaultCurrency || 'USD',
    isVerified: false,
    verificationOtpHash: hashOtp(otp),
    verificationOtpExpiresAt: new Date(Date.now() + OTP_EXPIRATION_MS),
    resendCooldownUntil: new Date(Date.now() + RESEND_COOLDOWN_MS),
  });

  await sendVerificationEmail(newUser.email, otp);
  return { isNew: true, email: newUser.email };
};

/**
 * Validates OTP code, marks user verified, seeds onboarding defaults, and issues session tokens.
 */
export const verifyUserOtp = async (input: VerifyOtpInput): Promise<UserSessionResult> => {
  const { email, otp } = input;
  const user = await User.findOne({ email });

  if (!user) {
    throw new AuthServiceError('No account found with this email address.', 404, 'USER_NOT_FOUND');
  }

  if (user.isVerified) {
    throw new AuthServiceError(
      'Account is already verified. Please sign in.',
      400,
      'ALREADY_VERIFIED'
    );
  }

  if (!user.verificationOtpHash || !user.verificationOtpExpiresAt) {
    throw new AuthServiceError(
      'No pending verification code found. Please request a new code.',
      400,
      'NO_PENDING_OTP'
    );
  }

  if (new Date() > user.verificationOtpExpiresAt) {
    throw new AuthServiceError(
      'Verification code has expired. Please request a new one.',
      400,
      'OTP_EXPIRED'
    );
  }

  if (!verifyOtp(otp, user.verificationOtpHash)) {
    throw new AuthServiceError('Invalid verification code.', 400, 'INVALID_OTP');
  }

  user.isVerified = true;
  user.verificationOtpHash = undefined;
  user.verificationOtpExpiresAt = undefined;
  user.resendCooldownUntil = undefined;

  const session = await issueUserSession(user);
  await seedUserDefaults(user._id, user.defaultCurrency);

  return session;
};

/**
 * Resends a fresh 6-digit OTP code if 60-second cooldown period has elapsed.
 */
export const resendUserOtp = async (email: string): Promise<void> => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AuthServiceError('No account found with this email address.', 404, 'USER_NOT_FOUND');
  }

  if (user.isVerified) {
    throw new AuthServiceError('Account is already verified.', 400, 'ALREADY_VERIFIED');
  }

  if (user.resendCooldownUntil && new Date() < user.resendCooldownUntil) {
    const waitSeconds = Math.ceil((user.resendCooldownUntil.getTime() - Date.now()) / 1000);
    throw new AuthServiceError(
      `Please wait ${waitSeconds} seconds before requesting a new code.`,
      429,
      'RESEND_COOLDOWN',
      { retryAfterSeconds: waitSeconds }
    );
  }

  const otp = generateOtp();
  user.verificationOtpHash = hashOtp(otp);
  user.verificationOtpExpiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);
  user.resendCooldownUntil = new Date(Date.now() + RESEND_COOLDOWN_MS);

  await user.save();
  await sendVerificationEmail(user.email, otp);
};

/**
 * Validates credentials and returns session tokens for verified users.
 */
export const loginUser = async (input: LoginInput): Promise<UserSessionResult> => {
  const { email, password } = input;
  const user = await User.findOne({ email });

  if (!user || !user.password) {
    throw new AuthServiceError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AuthServiceError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isVerified) {
    throw new AuthServiceError(
      'Please verify your email address to access your dashboard.',
      403,
      'EMAIL_NOT_VERIFIED',
      { email: user.email }
    );
  }

  return issueUserSession(user);
};

/**
 * Rotates tokens using a valid refresh token.
 */
export const refreshUserSession = async (
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthServiceError('Invalid or expired refresh token.', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.refreshTokenHash || !verifyOtp(refreshToken, user.refreshTokenHash)) {
    throw new AuthServiceError('Refresh token has been revoked.', 401, 'REVOKED_REFRESH_TOKEN');
  }

  const session = await issueUserSession(user);
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
};

/**
 * Invalidates the active refresh token session in database.
 */
export const logoutUser = async (userId?: string, refreshToken?: string): Promise<void> => {
  if (userId) {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    return;
  }

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await User.findByIdAndUpdate(payload.userId, { refreshTokenHash: null });
    } catch {
      // Token already invalid or expired
    }
  }
};
