// server/tests/fixtures/authFixtures.ts

// Test helper utilities and factory functions for seeding user and authentication test data.

import bcrypt from 'bcryptjs';
import { User, IUser } from '../../src/models/User.js';
import { hashOtp } from '../../src/utils/tokenUtils.js';

export interface CreateTestUserOptions {
  name?: string;
  email: string;
  password?: string;
  isVerified?: boolean;
  otp?: string;
  otpExpiresInMs?: number;
  resendCooldownInMs?: number;
  defaultCurrency?: string;
}

/**
 * Creates a test user in MongoDB with pre-hashed password and customizable OTP/verification status.
 */
export const createTestUser = async (options: CreateTestUserOptions): Promise<IUser> => {
  const {
    name = 'Test User',
    email,
    password = 'Password123!',
    isVerified = false,
    otp,
    otpExpiresInMs = 15 * 60 * 1000,
    resendCooldownInMs,
    defaultCurrency = 'USD',
  } = options;

  const hashedPassword = await bcrypt.hash(password, 10);
  const otpHash = otp ? hashOtp(otp) : undefined;
  const otpExpiresAt = otp ? new Date(Date.now() + otpExpiresInMs) : undefined;
  const resendCooldown = resendCooldownInMs ? new Date(Date.now() + resendCooldownInMs) : undefined;

  return User.create({
    name,
    email,
    password: hashedPassword,
    isVerified,
    verificationOtpHash: otpHash,
    verificationOtpExpiresAt: otpExpiresAt,
    resendCooldownUntil: resendCooldown,
    defaultCurrency,
  });
};
