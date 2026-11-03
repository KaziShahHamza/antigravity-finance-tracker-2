// server/tests/integration/auth.test.ts

// Integration tests covering the entire authentication lifecycle (register, verify, resend, login, refresh, logout).

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { setupTestDb, clearTestDb, teardownTestDb } from '../setupDb.js';
import { User } from '../../src/models/User.js';
import { Category } from '../../src/models/Category.js';
import { Account } from '../../src/models/Account.js';
import { generateOtp, hashOtp } from '../../src/utils/tokenUtils.js';

describe('Auth Endpoints Integration (/api/auth)', () => {
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
      expect(user?.verificationOtpExpiresAt).toBeDefined();
    });

    it('rejects registration with invalid email or weak password', async () => {
      const invalidPayload = {
        name: 'A',
        email: 'not-an-email',
        password: 'weak',
      };

      const res = await request(app).post('/api/auth/register').send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('rejects registration when email is already registered and verified', async () => {
      if (!isDbConnected) return;

      await User.create({
        name: 'Existing Verified',
        email: 'verified@example.com',
        password: 'hashedpassword',
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

      await User.create({
        name: 'Unverified Guy',
        email: 'unverified@example.com',
        password: 'hashedpassword',
        isVerified: false,
        verificationOtpHash: 'oldhash',
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Unverified Guy Updated',
        email: 'unverified@example.com',
        password: 'NewPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findOne({ email: 'unverified@example.com' });
      expect(user?.name).toBe('Unverified Guy Updated');
      expect(user?.verificationOtpHash).not.toBe('oldhash');
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('verifies account with valid OTP, seeds defaults, and returns session tokens', async () => {
      if (!isDbConnected) return;

      const plainOtp = generateOtp();
      const otpHash = hashOtp(plainOtp);

      const user = await User.create({
        name: 'Test Verify',
        email: 'verify@example.com',
        password: 'hashedpassword',
        defaultCurrency: 'BDT',
        isVerified: false,
        verificationOtpHash: otpHash,
        verificationOtpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      const res = await request(app).post('/api/auth/verify-otp').send({
        email: 'verify@example.com',
        otp: plainOtp,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.isVerified).toBe(true);
      expect(res.body.user.defaultCurrency).toBe('BDT');

      // Verify DB state
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.isVerified).toBe(true);
      expect(updatedUser?.verificationOtpHash).toBeFalsy();
      expect(updatedUser?.refreshTokenHash).toBeDefined();

      // Verify onboarding seed was triggered (12 default categories and 1 checking account)
      const categories = await Category.find({ userId: user._id });
      expect(categories).toHaveLength(12);

      const account = await Account.findOne({ userId: user._id });
      expect(account).toBeDefined();
      expect(account?.name).toBe('Main Checking');
      expect(account?.currency).toBe('BDT');
      expect(account?.balance).toBe(0);
    });

    it('rejects invalid OTP code', async () => {
      if (!isDbConnected) return;

      await User.create({
        name: 'Mismatch User',
        email: 'mismatch@example.com',
        password: 'hashedpassword',
        isVerified: false,
        verificationOtpHash: hashOtp('123456'),
        verificationOtpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      const res = await request(app).post('/api/auth/verify-otp').send({
        email: 'mismatch@example.com',
        otp: '654321',
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_OTP');
    });

    it('rejects expired OTP code', async () => {
      if (!isDbConnected) return;

      const plainOtp = '112233';
      await User.create({
        name: 'Expired User',
        email: 'expired@example.com',
        password: 'hashedpassword',
        isVerified: false,
        verificationOtpHash: hashOtp(plainOtp),
        verificationOtpExpiresAt: new Date(Date.now() - 1000), // expired 1s ago
      });

      const res = await request(app).post('/api/auth/verify-otp').send({
        email: 'expired@example.com',
        otp: plainOtp,
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('OTP_EXPIRED');
    });
  });

  describe('POST /api/auth/resend-otp', () => {
    it('enforces 60-second cooldown on OTP resend requests', async () => {
      if (!isDbConnected) return;

      await User.create({
        name: 'Cooldown User',
        email: 'cooldown@example.com',
        password: 'hashedpassword',
        isVerified: false,
        verificationOtpHash: hashOtp('111111'),
        verificationOtpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        resendCooldownUntil: new Date(Date.now() + 45 * 1000), // cooldown active
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

      await User.create({
        name: 'Ready User',
        email: 'ready@example.com',
        password: 'hashedpassword',
        isVerified: false,
        verificationOtpHash: hashOtp('111111'),
        verificationOtpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        resendCooldownUntil: new Date(Date.now() - 1000), // expired cooldown
      });

      const res = await request(app).post('/api/auth/resend-otp').send({
        email: 'ready@example.com',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findOne({ email: 'ready@example.com' });
      expect(user?.resendCooldownUntil).toBeDefined();
      expect(user?.resendCooldownUntil?.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /api/auth/login', () => {
    it('rejects login for unverified accounts with 403 EMAIL_NOT_VERIFIED', async () => {
      if (!isDbConnected) return;

      await request(app).post('/api/auth/register').send({
        name: 'Unverified Login',
        email: 'unverified-login@example.com',
        password: 'ValidPassword123!',
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'unverified-login@example.com',
        password: 'ValidPassword123!',
      });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('rejects incorrect password with 401 INVALID_CREDENTIALS', async () => {
      if (!isDbConnected) return;

      // Register and verify user
      await request(app).post('/api/auth/register').send({
        name: 'Login User',
        email: 'login@example.com',
        password: 'CorrectPassword123!',
      });

      const user = await User.findOne({ email: 'login@example.com' });
      const otp = '998877';
      user!.verificationOtpHash = hashOtp(otp);
      user!.verificationOtpExpiresAt = new Date(Date.now() + 100000);
      await user!.save();

      await request(app).post('/api/auth/verify-otp').send({
        email: 'login@example.com',
        otp,
      });

      // Attempt login with wrong password
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'WrongPassword999!',
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('logs in verified user and returns valid session tokens', async () => {
      if (!isDbConnected) return;

      await request(app).post('/api/auth/register').send({
        name: 'Login User',
        email: 'login-success@example.com',
        password: 'CorrectPassword123!',
      });

      const user = await User.findOne({ email: 'login-success@example.com' });
      const otp = '123987';
      user!.verificationOtpHash = hashOtp(otp);
      user!.verificationOtpExpiresAt = new Date(Date.now() + 100000);
      await user!.save();

      await request(app).post('/api/auth/verify-otp').send({
        email: 'login-success@example.com',
        otp,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'login-success@example.com',
        password: 'CorrectPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe('login-success@example.com');
    });
  });

  describe('POST /api/auth/refresh and /api/auth/logout', () => {
    it('refreshes token successfully and rotates refresh token', async () => {
      if (!isDbConnected) return;

      // Register, verify, and login
      await request(app).post('/api/auth/register').send({
        name: 'Session User',
        email: 'session@example.com',
        password: 'Password123!',
      });

      const user = await User.findOne({ email: 'session@example.com' });
      const otp = '556677';
      user!.verificationOtpHash = hashOtp(otp);
      user!.verificationOtpExpiresAt = new Date(Date.now() + 100000);
      await user!.save();

      const verifyRes = await request(app).post('/api/auth/verify-otp').send({
        email: 'session@example.com',
        otp,
      });

      const originalRefreshToken = verifyRes.body.refreshToken;

      // Call refresh
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: originalRefreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.accessToken).toBeDefined();
      expect(refreshRes.body.refreshToken).toBeDefined();
      expect(refreshRes.body.refreshToken).not.toBe(originalRefreshToken);

      // Verify that using old refresh token is now revoked
      const revokedRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: originalRefreshToken });

      expect(revokedRes.status).toBe(401);
      expect(revokedRes.body.code).toBe('REVOKED_REFRESH_TOKEN');
    });

    it('logs out and revokes active refresh token', async () => {
      if (!isDbConnected) return;

      await request(app).post('/api/auth/register').send({
        name: 'Logout User',
        email: 'logout@example.com',
        password: 'Password123!',
      });

      const user = await User.findOne({ email: 'logout@example.com' });
      const otp = '334455';
      user!.verificationOtpHash = hashOtp(otp);
      user!.verificationOtpExpiresAt = new Date(Date.now() + 100000);
      await user!.save();

      const verifyRes = await request(app).post('/api/auth/verify-otp').send({
        email: 'logout@example.com',
        otp,
      });

      const activeRefreshToken = verifyRes.body.refreshToken;

      // Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: activeRefreshToken });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Attempting to refresh after logout should fail
      const postLogoutRefresh = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: activeRefreshToken });

      expect(postLogoutRefresh.status).toBe(401);
    });
  });
});
