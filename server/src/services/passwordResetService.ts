// server/src/services/passwordResetService.ts

// Service layer handling password reset OTP generation, email notifications, and password updates.

import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ResetPasswordInput } from '../schemas/authSchemas.js';
import { generateOtp, hashOtp, verifyOtp } from '../utils/tokenUtils.js';
import { sendPasswordResetEmail } from './emailService.js';

export class PasswordResetError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PasswordResetError';
  }
}

const OTP_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

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
    throw new PasswordResetError(
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
    throw new PasswordResetError('Invalid or expired reset code.', 400, 'INVALID_RESET_CODE');
  }

  if (new Date() > user.passwordResetOtpExpiresAt) {
    throw new PasswordResetError(
      'Password reset code has expired. Please request a new code.',
      400,
      'OTP_EXPIRED'
    );
  }

  if (!verifyOtp(otp, user.passwordResetOtpHash)) {
    throw new PasswordResetError('Invalid password reset code.', 400, 'INVALID_OTP');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiresAt = undefined;
  user.resendCooldownUntil = undefined;
  user.refreshTokenHash = null as unknown as string;
  user.isVerified = true;

  await user.save();
};
