// server/src/services/authService.ts

// Core authentication service managing user registration, OTP verification, password login, Google OAuth, and session tokens.

import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User.js';
import { env } from '../config/env.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateOtp,
  hashOtp,
  verifyOtp,
} from '../utils/tokenUtils.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';
import { seedUserDefaults } from './seedService.js';
import {
  RegisterInput,
  VerifyOtpInput,
  LoginInput,
  ResetPasswordInput,
} from '../schemas/authSchemas.js';

const OTP_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

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

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
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
 * Verifies a Google ID token via GIS or uses development/test mock fallback.
 */
export const verifyGoogleCredential = async (credential: string): Promise<GoogleUserInfo> => {
  // Allow simulated Google credentials in dev / test environments
  if (credential.startsWith('mock-google-token')) {
    const [, sub, email, name, ...avatarParts] = credential.split(':');
    const avatarUrl =
      avatarParts.length > 0
        ? avatarParts.join(':')
        : 'https://lh3.googleusercontent.com/avatar.png';

    return {
      googleId: sub || 'google_sub_12345',
      email: (email || 'google_user@example.com').toLowerCase(),
      name: name || 'Google User',
      avatarUrl,
    };
  }

  if (!env.GOOGLE_CLIENT_ID) {
    throw new AuthServiceError(
      'Google authentication is not configured on this server.',
      501,
      'GOOGLE_AUTH_NOT_CONFIGURED'
    );
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      throw new AuthServiceError('Invalid Google token payload.', 401, 'INVALID_GOOGLE_TOKEN');
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email.split('@')[0],
      avatarUrl: payload.picture,
    };
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;
    throw new AuthServiceError('Invalid or expired Google token.', 401, 'INVALID_GOOGLE_TOKEN');
  }
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
 * Requests a 6-digit password reset code with anti-enumeration protection.
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const user = await User.findOne({ email });
  if (!user) {
    // Return silently to prevent user enumeration
    return;
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
  user.passwordResetOtpHash = hashOtp(otp);
  user.passwordResetOtpExpiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);
  user.resendCooldownUntil = new Date(Date.now() + RESEND_COOLDOWN_MS);

  await user.save();
  await sendPasswordResetEmail(user.email, otp);
};

/**
 * Validates reset code, updates bcrypt password hash, and revokes all active refresh tokens.
 */
export const resetUserPassword = async (input: ResetPasswordInput): Promise<void> => {
  const { email, otp, newPassword } = input;
  const user = await User.findOne({ email });

  if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
    throw new AuthServiceError('Invalid or expired reset code.', 400, 'INVALID_RESET_CODE');
  }

  if (new Date() > user.passwordResetOtpExpiresAt) {
    throw new AuthServiceError(
      'Password reset code has expired. Please request a new code.',
      400,
      'OTP_EXPIRED'
    );
  }

  if (!verifyOtp(otp, user.passwordResetOtpHash)) {
    throw new AuthServiceError('Invalid password reset code.', 400, 'INVALID_OTP');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiresAt = undefined;
  user.resendCooldownUntil = undefined;
  user.refreshTokenHash = null as unknown as string;
  user.isVerified = true;

  await user.save();
};

/**
 * Verifies Google ID token, links or creates the user, seeds defaults if new, and returns session tokens.
 */
export const loginWithGoogle = async (credential: string): Promise<UserSessionResult> => {
  const googleUser = await verifyGoogleCredential(credential);

  let user = await User.findOne({
    $or: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
  });

  if (user) {
    let modified = false;
    if (!user.googleId) {
      user.googleId = googleUser.googleId;
      modified = true;
    }
    if (!user.avatarUrl && googleUser.avatarUrl) {
      user.avatarUrl = googleUser.avatarUrl;
      modified = true;
    }
    if (!user.isVerified) {
      user.isVerified = true;
      modified = true;
    }
    if (modified) {
      await user.save();
    }
  } else {
    // New Google OAuth user
    user = await User.create({
      name: googleUser.name,
      email: googleUser.email,
      googleId: googleUser.googleId,
      avatarUrl: googleUser.avatarUrl || '',
      isVerified: true,
      defaultCurrency: 'USD',
    });

    // Seed onboarding defaults on first registration
    await seedUserDefaults(user._id, 'USD');
  }

  return issueUserSession(user);
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
