// server/tests/integration/passwordAndGoogleAuth.test.ts

// Integration tests for forgot password, reset password, and Google Identity Services OAuth flows.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { setupTestDb, clearTestDb, teardownTestDb } from '../setupDb.js';
import { User } from '../../src/models/User.js';
import { Category } from '../../src/models/Category.js';
import { Account } from '../../src/models/Account.js';
import { createTestUser } from '../fixtures/authFixtures.js';

describe('Password Recovery & Google OAuth (/api/auth)', () => {
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

  describe('POST /api/auth/forgot-password', () => {
    it('sets reset OTP and returns generic success for existing user', async () => {
      if (!isDbConnected) return;

      await createTestUser({
        email: 'forgot@example.com',
        isVerified: true,
      });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgot@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findOne({ email: 'forgot@example.com' });
      expect(user?.passwordResetOtpHash).toBeDefined();
      expect(user?.passwordResetOtpExpiresAt).toBeDefined();
    });

    it('returns 200 generic success for non-existent email (anti-enumeration)', async () => {
      if (!isDbConnected) return;

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('enforces 60-second cooldown on repeated forgot-password requests', async () => {
      if (!isDbConnected) return;

      await createTestUser({
        email: 'cooldown-forgot@example.com',
        isVerified: true,
        resendCooldownInMs: 45 * 1000,
      });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'cooldown-forgot@example.com' });

      expect(res.status).toBe(429);
      expect(res.body.code).toBe('RESEND_COOLDOWN');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('successfully resets password, invalidates active sessions, and updates login credential', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({
        email: 'resetme@example.com',
        password: 'OldPassword123!',
        passwordResetOtp: '654321',
        isVerified: true,
      });

      // Login to obtain an active refresh token
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'resetme@example.com',
        password: 'OldPassword123!',
      });
      const activeRefreshToken = loginRes.body.refreshToken;

      // Reset password with valid code
      const resetRes = await request(app).post('/api/auth/reset-password').send({
        email: 'resetme@example.com',
        otp: '654321',
        newPassword: 'BrandNewPassword123!',
      });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Verify DB state
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.passwordResetOtpHash).toBeFalsy();
      expect(updatedUser?.refreshTokenHash).toBeFalsy();

      // Old password fails, new password succeeds
      const oldLoginRes = await request(app).post('/api/auth/login').send({
        email: 'resetme@example.com',
        password: 'OldPassword123!',
      });
      expect(oldLoginRes.status).toBe(401);

      const newLoginRes = await request(app).post('/api/auth/login').send({
        email: 'resetme@example.com',
        password: 'BrandNewPassword123!',
      });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.accessToken).toBeDefined();

      // Prior refresh token is invalidated
      const refreshAttempt = await request(app).post('/api/auth/refresh').send({
        refreshToken: activeRefreshToken,
      });
      expect(refreshAttempt.status).toBe(401);
    });

    it('rejects invalid or expired reset code', async () => {
      if (!isDbConnected) return;

      await createTestUser({
        email: 'badcode@example.com',
        passwordResetOtp: '112233',
        passwordResetOtpExpiresInMs: 15 * 60 * 1000,
      });

      const badCodeRes = await request(app).post('/api/auth/reset-password').send({
        email: 'badcode@example.com',
        otp: '999999',
        newPassword: 'NewPassword123!',
      });
      expect(badCodeRes.status).toBe(400);
      expect(badCodeRes.body.code).toBe('INVALID_OTP');

      await createTestUser({
        email: 'expiredcode@example.com',
        passwordResetOtp: '445566',
        passwordResetOtpExpiresInMs: -1000,
      });

      const expiredRes = await request(app).post('/api/auth/reset-password').send({
        email: 'expiredcode@example.com',
        otp: '445566',
        newPassword: 'NewPassword123!',
      });
      expect(expiredRes.status).toBe(400);
      expect(expiredRes.body.code).toBe('OTP_EXPIRED');
    });
  });

  describe('POST /api/auth/google', () => {
    it('creates new verified user, triggers onboarding seed defaults, and issues session tokens', async () => {
      if (!isDbConnected) return;

      const mockCredential =
        'mock-google-token:gid_98765:clark.kent@dailyplanet.com:Clark Kent:https://lh3.google.com/superman.png';

      const res = await request(app).post('/api/auth/google').send({
        credential: mockCredential,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe('clark.kent@dailyplanet.com');
      expect(res.body.user.name).toBe('Clark Kent');
      expect(res.body.user.avatarUrl).toBe('https://lh3.google.com/superman.png');
      expect(res.body.user.isVerified).toBe(true);

      const user = await User.findOne({ email: 'clark.kent@dailyplanet.com' });
      expect(user).toBeDefined();
      expect(user?.googleId).toBe('gid_98765');

      // Verify onboarding default seed ran
      const categories = await Category.find({ userId: user!._id });
      expect(categories).toHaveLength(12);

      const account = await Account.findOne({ userId: user!._id });
      expect(account?.name).toBe('Main Checking');
    });

    it('links Google account to existing user with same email', async () => {
      if (!isDbConnected) return;

      const existingUser = await createTestUser({
        name: 'Bruce Wayne',
        email: 'bruce@wayne.corp',
        password: 'Password123!',
        isVerified: false,
      });

      const mockCredential =
        'mock-google-token:gid_wayne:bruce@wayne.corp:Bruce Wayne:https://avatar.png';

      const res = await request(app).post('/api/auth/google').send({
        credential: mockCredential,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('bruce@wayne.corp');

      const updated = await User.findById(existingUser._id);
      expect(updated?.googleId).toBe('gid_wayne');
      expect(updated?.isVerified).toBe(true);
    });

    it('signs in returning Google user without creating duplicates', async () => {
      if (!isDbConnected) return;

      await createTestUser({
        name: 'Diana Prince',
        email: 'diana@themyscira.gov',
        googleId: 'gid_wonderwoman',
        isVerified: true,
      });

      const mockCredential =
        'mock-google-token:gid_wonderwoman:diana@themyscira.gov:Diana Prince:https://avatar.png';

      const res = await request(app).post('/api/auth/google').send({
        credential: mockCredential,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const count = await User.countDocuments({ email: 'diana@themyscira.gov' });
      expect(count).toBe(1);
    });
  });
});
