// server/tests/integration/users.test.ts

// Integration tests for user profile retrieval, preferences update, password change, and demo data seeding.

import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Account } from '../../src/models/Account.js';
import { Budget } from '../../src/models/Budget.js';
import { Transaction } from '../../src/models/Transaction.js';
import { User } from '../../src/models/User.js';
import { generateAccessToken } from '../../src/utils/tokenUtils.js';
import { createTestUser } from '../fixtures/authFixtures.js';
import { clearTestDb, setupTestDb, teardownTestDb } from '../setupDb.js';

describe('User Profile & Preferences API (/api/users)', () => {
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

  describe('GET /api/users/me', () => {
    it('rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('returns sanitized user profile for authenticated user', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({
        name: 'Jane Doe',
        email: 'jane@example.com',
        isVerified: true,
      });

      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Jane Doe');
      expect(res.body.user.email).toBe('jane@example.com');
      expect(res.body.user.defaultCurrency).toBe('USD');
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.refreshTokenHash).toBeUndefined();
    });
  });

  describe('PATCH /api/users/profile', () => {
    it('updates user name, default currency, monthly budget, theme, and custom exchange rates', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({
        name: 'Initial Name',
        email: 'profile-update@example.com',
        isVerified: true,
      });

      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          defaultCurrency: 'EUR',
          monthlyBudgetLimit: 2500,
          themePreference: 'dark',
          customExchangeRates: {
            BDT: 130.5,
            GBP: 0.85,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Updated Name');
      expect(res.body.user.defaultCurrency).toBe('EUR');
      expect(res.body.user.monthlyBudgetLimit).toBe(2500);
      expect(res.body.user.themePreference).toBe('dark');
      expect(res.body.user.customExchangeRates.BDT).toBe(130.5);

      const dbUser = await User.findById(user._id);
      expect(dbUser?.name).toBe('Updated Name');
      expect(dbUser?.defaultCurrency).toBe('EUR');
      expect(dbUser?.monthlyBudgetLimit).toBe(2500);
      expect(dbUser?.themePreference).toBe('dark');
    });

    it('rejects invalid currency format or negative budget limit', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'invalid-profile@example.com', isVerified: true });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          defaultCurrency: 'TOOLONG',
          monthlyBudgetLimit: -100,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/users/password', () => {
    it('updates password, hashes with bcrypt, and invalidates refresh token', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({
        email: 'pw-change@example.com',
        password: 'OldPassword123!',
        isVerified: true,
      });
      user.refreshTokenHash = 'some-valid-token-hash';
      await user.save();

      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const res = await request(app)
        .patch('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'BrandNewPassword999',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.refreshTokenHash).toBeUndefined();

      const isMatchOld = await bcrypt.compare('OldPassword123!', updatedUser!.password!);
      const isMatchNew = await bcrypt.compare('BrandNewPassword999', updatedUser!.password!);
      expect(isMatchOld).toBe(false);
      expect(isMatchNew).toBe(true);
    });

    it('rejects incorrect current password with 400 INVALID_CURRENT_PASSWORD', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({
        email: 'wrong-current-pw@example.com',
        password: 'RealPassword123!',
        isVerified: true,
      });

      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const res = await request(app)
        .patch('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword999',
          newPassword: 'BrandNewPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_CURRENT_PASSWORD');
    });

    it('rejects weak new password or same password as current', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({
        email: 'weak-pw@example.com',
        password: 'ValidPassword123!',
        isVerified: true,
      });

      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const resSame = await request(app)
        .patch('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'ValidPassword123!',
          newPassword: 'ValidPassword123!',
        });

      expect(resSame.status).toBe(400);

      const resWeak = await request(app)
        .patch('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'ValidPassword123!',
          newPassword: 'weak',
        });

      expect(resWeak.status).toBe(400);
    });
  });

  describe('POST /api/users/demo-data', () => {
    it('seeds sample accounts, monthly budgets, and realistic transactions for user', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({
        email: 'demo-user@example.com',
        defaultCurrency: 'USD',
        isVerified: true,
      });

      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const res = await request(app)
        .post('/api/users/demo-data')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountsCreated).toBeGreaterThanOrEqual(4);
      expect(res.body.data.budgetsCreated).toBeGreaterThanOrEqual(4);
      expect(res.body.data.transactionsCreated).toBeGreaterThanOrEqual(10);

      // Verify database entities are linked to user
      const userAccounts = await Account.find({ userId: user._id });
      const userBudgets = await Budget.find({ userId: user._id });
      const userTransactions = await Transaction.find({ userId: user._id });

      expect(userAccounts.length).toBe(res.body.data.accountsCreated);
      expect(userBudgets.length).toBe(res.body.data.budgetsCreated);
      expect(userTransactions.length).toBe(res.body.data.transactionsCreated);

      // Verify all seeded transactions are marked as isDemo
      expect(userTransactions.every((tx) => tx.isDemo === true)).toBe(true);
    });

    it('is idempotent and allows reloading demo data without duplicate key errors', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({
        email: 'demo-reload-user@example.com',
        defaultCurrency: 'USD',
        isVerified: true,
      });

      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      // First call
      const res1 = await request(app)
        .post('/api/users/demo-data')
        .set('Authorization', `Bearer ${token}`);
      expect(res1.status).toBe(201);

      // Second call (reload)
      const res2 = await request(app)
        .post('/api/users/demo-data')
        .set('Authorization', `Bearer ${token}`);
      expect(res2.status).toBe(201);
      expect(res2.body.success).toBe(true);
      expect(res2.body.data.budgetsCreated).toBe(4);
    });
  });
});
