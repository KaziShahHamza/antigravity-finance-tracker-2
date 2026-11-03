// server/src/utils/tokenUtils.ts

// JWT access/refresh token generation and verification, plus secure 6-digit OTP utilities.

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

/**
 * Signs a short-lived access token for API authorization.
 */
export const generateAccessToken = (
  payload: AuthTokenPayload,
  expiresIn: string | number = env.JWT_ACCESS_EXPIRES_IN
): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Signs a long-lived refresh token for silent session renewal.
 */
export const generateRefreshToken = (
  payload: AuthTokenPayload,
  expiresIn: string | number = env.JWT_REFRESH_EXPIRES_IN
): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    jwtid: crypto.randomUUID(),
  });
};

/**
 * Decodes and verifies an access token against JWT_ACCESS_SECRET.
 */
export const verifyAccessToken = (token: string): AuthTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  return decoded as AuthTokenPayload;
};

/**
 * Decodes and verifies a refresh token against JWT_REFRESH_SECRET.
 */
export const verifyRefreshToken = (token: string): AuthTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  return decoded as AuthTokenPayload;
};

/**
 * Generates a cryptographically secure 6-digit numeric OTP (100000 - 999999).
 */
export const generateOtp = (): string => {
  const otpNumber = crypto.randomInt(100000, 1000000);
  return otpNumber.toString();
};

/**
 * Securely hashes an OTP string using SHA-256 for safe database storage.
 */
export const hashOtp = (otp: string): string => {
  return crypto.createHash('sha256').update(otp.trim()).digest('hex');
};

/**
 * Verifies a candidate OTP against a stored SHA-256 hash using constant-time comparison.
 */
export const verifyOtp = (candidateOtp: string, storedHash: string): boolean => {
  if (!candidateOtp || !storedHash) {
    return false;
  }

  const candidateHash = hashOtp(candidateOtp);
  if (candidateHash.length !== storedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(storedHash, 'hex'));
};
