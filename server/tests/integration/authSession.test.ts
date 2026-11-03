// server/tests/integration/authSession.test.ts

// Integration tests for user login, refresh token rotation, revocation, and session logout.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { setupTestDb, clearTestDb, teardownTestDb } from '../setupDb.js';
import { createTestUser } from '../fixtures/authFixtures.js';

describe('Auth Sessions & Token Lifecycle (/api/auth)', () => {
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

  describe('POST /api/auth/login', () => {
    it('rejects login for unverified accounts with 403 EMAIL_NOT_VERIFIED', async () => {
      if (!isDbConnected) return;

      await createTestUser({
        email: 'unverified-login@example.com',
        password: 'ValidPassword123!',
        isVerified: false,
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

      await createTestUser({
        email: 'login@example.com',
        password: 'CorrectPassword123!',
        isVerified: true,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'WrongPassword999!',
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('logs in verified user and returns valid session tokens', async () => {
      if (!isDbConnected) return;

      await createTestUser({
        email: 'login-success@example.com',
        password: 'CorrectPassword123!',
        isVerified: true,
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

      await createTestUser({
        email: 'session@example.com',
        password: 'Password123!',
        isVerified: true,
      });

      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'session@example.com',
        password: 'Password123!',
      });

      const originalRefreshToken = loginRes.body.refreshToken;

      // Refresh session
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

      await createTestUser({
        email: 'logout@example.com',
        password: 'Password123!',
        isVerified: true,
      });

      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'logout@example.com',
        password: 'Password123!',
      });

      const activeRefreshToken = loginRes.body.refreshToken;

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
