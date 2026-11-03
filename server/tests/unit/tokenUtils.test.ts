// server/tests/unit/tokenUtils.test.ts

// Unit tests for JWT signing/verification, OTP generation/hashing, and auth middleware.

import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateOtp,
  hashOtp,
  verifyOtp,
} from '../../src/utils/tokenUtils.js';
import { authenticateToken } from '../../src/middlewares/authMiddleware.js';

describe('tokenUtils', () => {
  const dummyPayload = {
    userId: '65f1234567890abcdef12345',
    email: 'test@example.com',
  };

  describe('JWT Access Token', () => {
    it('generates and verifies a valid access token', () => {
      const token = generateAccessToken(dummyPayload);
      expect(typeof token).toBe('string');

      const verified = verifyAccessToken(token);
      expect(verified.userId).toBe(dummyPayload.userId);
      expect(verified.email).toBe(dummyPayload.email);
    });

    it('rejects an expired access token', async () => {
      const expiredToken = generateAccessToken(dummyPayload, -1);
      expect(() => verifyAccessToken(expiredToken)).toThrow(jwt.TokenExpiredError);
    });

    it('rejects an invalid token signature', () => {
      const forgedToken = jwt.sign(
        dummyPayload,
        'wrong_secret_key_that_is_at_least_32_characters_long'
      );
      expect(() => verifyAccessToken(forgedToken)).toThrow(jwt.JsonWebTokenError);
    });
  });

  describe('JWT Refresh Token', () => {
    it('generates and verifies a valid refresh token', () => {
      const token = generateRefreshToken(dummyPayload);
      expect(typeof token).toBe('string');

      const verified = verifyRefreshToken(token);
      expect(verified.userId).toBe(dummyPayload.userId);
      expect(verified.email).toBe(dummyPayload.email);
    });

    it('rejects an expired refresh token', () => {
      const expiredToken = generateRefreshToken(dummyPayload, -1);
      expect(() => verifyRefreshToken(expiredToken)).toThrow(jwt.TokenExpiredError);
    });

    it('rejects a refresh token checked with wrong secret', () => {
      const token = generateRefreshToken(dummyPayload);
      // Access secret is different from refresh secret
      expect(() => verifyAccessToken(token)).toThrow();
    });
  });

  describe('OTP Generation and Hashing', () => {
    it('generates a 6-digit numeric OTP between 100000 and 999999', () => {
      for (let i = 0; i < 50; i++) {
        const otp = generateOtp();
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
        const num = parseInt(otp, 10);
        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThanOrEqual(999999);
      }
    });

    it('hashes and securely verifies matching OTP', () => {
      const otp = '482910';
      const hash = hashOtp(otp);

      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64); // SHA-256 hex string
      expect(verifyOtp(otp, hash)).toBe(true);
    });

    it('fails verification for incorrect OTP or blank values', () => {
      const otp = '482910';
      const hash = hashOtp(otp);

      expect(verifyOtp('111111', hash)).toBe(false);
      expect(verifyOtp('', hash)).toBe(false);
      expect(verifyOtp(otp, '')).toBe(false);
    });
  });

  describe('authenticateToken middleware', () => {
    const mockResponse = () => {
      const res: Partial<Response> = {};
      res.status = vi.fn().mockReturnValue(res);
      res.json = vi.fn().mockReturnValue(res);
      return res as Response;
    };

    it('returns 401 if Authorization header is missing', () => {
      const req = { headers: {} } as Request;
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNAUTHORIZED' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 if Authorization header does not start with Bearer', () => {
      const req = { headers: { authorization: 'Basic 123456' } } as unknown as Request;
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 if token is expired', () => {
      const expiredToken = generateAccessToken(dummyPayload, -1);
      const req = {
        headers: { authorization: `Bearer ${expiredToken}` },
      } as unknown as Request;
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_EXPIRED' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 if token is invalid or malformed', () => {
      const req = {
        headers: { authorization: 'Bearer invalid.jwt.token' },
      } as unknown as Request;
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_TOKEN' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('attaches payload to req.user and calls next() on valid token', () => {
      const validToken = generateAccessToken(dummyPayload);
      const req = {
        headers: { authorization: `Bearer ${validToken}` },
      } as unknown as Request;
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(dummyPayload.userId);
      expect(req.user?.email).toBe(dummyPayload.email);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
