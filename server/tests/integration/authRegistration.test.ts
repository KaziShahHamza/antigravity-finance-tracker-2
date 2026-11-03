// server/tests/integration/authRegistration.test.ts

// Integration tests for user signup, 6-digit OTP verification, cooldowns, and onboarding seeding.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { setupTestDb, clearTestDb, teardownTestDb } from '../setupDb.js';
import { User } from '../../src/models/User.js';
import { Category } from '../../src/models/Category.js';
import { Account } from '../../src/models/Account.js';
import { createTestUser } from '../fixtures/authFixtures.js';

describe('Auth Registration & OTP Verification (/api/auth)', () => {
  let isDbConnected = false;

  beforeAll(async () => {
    isDbConnected = await setupTestDb();
  });

  afterAll(async () => {
    if (isDbConnected) {
      await clearTestDb();
      await teardownTestDb();
    }
  });

  beforeEach(async () => {
    if (isDbConnected) {
      await clearTestDb();
    }
  });

  describe('POST /api/auth/register', () => {
    it('successfully registers a new user with unverified status', async () => {
      if (!isDbConnected) return;

      const payload = {
        name: 'Jordan Miller',
        email: 'jordan@example.com',
        password: 'Password123!',
        defaultCurrency: 'USD',
      };

      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.email).toBe(payload.email);

      const user = await User.findOne({ email: payload.email });
      expect(user).toBeDefined();
      expect(user?.name).toBe(payload.name);
      expect(user?.isVerified).toBe(false);
      expect(user?.verificationOtpHash).toBeTruthy();
    });

    it('rejects registration with invalid email or weak password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'A',
        email: 'not-an-email',
        password: 'weak',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('rejects registration when email is already verified', async () => {
      if (!isDbConnected) return;

      await createTestUser({
        email: 'verified@example.com',
        isVerified: true,
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Guy',
        email: 'verified@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('allows unverified user to re-register, refreshing their OTP', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({
        name: 'Unverified Guy',
        email: 'unverified@example.com',
        otp: '111111',
      });

      const oldHash = user.verificationOtpHash;

      const res = await request(app).post('/api/auth/register').send({
        name: 'Unverified Guy Updated',
        email: 'unverified@example.com',
        password: 'NewPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await User.findOne({ email: 'unverified@example.com' });
      expect(updated?.name).toBe('Unverified Guy Updated');
      expect(updated?.verificationOtpHash).not.toBe(oldHash);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('verifies account with valid OTP, seeds defaults, and returns tokens', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({
        email: 'verify@example.com',
        otp: '482910',
        defaultCurrency: 'BDT',
      });

      const res = await request(app).post('/api/auth/verify-otp').send({
        email: 'verify@example.com',
        otp: '482910',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.isVerified).toBe(true);

      // Verify DB state
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.isVerified).toBe(true);
      expect(updatedUser?.verificationOtpHash).toBeFalsy();
      expect(updatedUser?.refreshTokenHash).toBeDefined();

      // Verify onboarding seed (12 categories + 1 checking account)
      const categories = await Category.find({ userId: user._id });
      expect(categories).toHaveLength(12);

      const account = await Account.findOne({ userId: user._id });
      expect(account?.name).toBe('Main Checking');
      expect(account?.currency).toBe('BDT');
    });

    it('rejects invalid or expired OTP code', async () => {
      if (!isDbConnected) return;

      await createTestUser({
        email: 'mismatch@example.com',
        otp: '123456',
      });

      const mismatchRes = await request(app).post('/api/auth/verify-otp').send({
        email: 'mismatch@example.com',
        otp: '654321',
      });
      expect(mismatchRes.status).toBe(400);
      expect(mismatchRes.body.code).toBe('INVALID_OTP');

      await createTestUser({
        email: 'expired@example.com',
        otp: '999999',
        otpExpiresInMs: -1000,
      });

      const expiredRes = await request(app).post('/api/auth/verify-otp').send({
        email: 'expired@example.com',
        otp: '999999',
      });
      expect(expiredRes.status).toBe(400);
      expect(expiredRes.body.code).toBe('OTP_EXPIRED');
    });
  });

  describe('POST /api/auth/resend-otp', () => {
    it('enforces 60-second cooldown on OTP resend requests', async () => {
      if (!isDbConnected) return;

      await createTestUser({
        email: 'cooldown@example.com',
        otp: '111111',
        resendCooldownInMs: 45 * 1000,
      });

      const res = await request(app).post('/api/auth/resend-otp').send({
        email: 'cooldown@example.com',
      });

      expect(res.status).toBe(429);
      expect(res.body.code).toBe('RESEND_COOLDOWN');
      expect(res.body.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('successfully resends OTP when cooldown has elapsed', async () => {
      if (!isDbConnected) return;

      await createTestUser({
        email: 'ready@example.com',
        otp: '111111',
        resendCooldownInMs: -1000,
      });

      const res = await request(app).post('/api/auth/resend-otp').send({
        email: 'ready@example.com',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
