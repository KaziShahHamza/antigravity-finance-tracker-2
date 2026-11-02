// server/tests/unit/validateRequest.test.ts

// Unit tests for validateRequest middleware and env configuration.

import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { env } from '../../src/config/env.js';
import { validateRequest } from '../../src/middlewares/validateRequest.js';

describe('env configuration', () => {
  it('exposes validated environment variables with defaults', () => {
    expect(env.PORT).toBeDefined();
    expect(typeof env.PORT).toBe('number');
    expect(env.NODE_ENV).toBeDefined();
    expect(['development', 'test', 'production']).toContain(env.NODE_ENV);
    expect(env.JWT_ACCESS_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(env.JWT_REFRESH_SECRET.length).toBeGreaterThanOrEqual(32);
  });
});

describe('validateRequest middleware', () => {
  const dummySchema = z.object({
    email: z.string().email(),
    amount: z.number().positive(),
  });

  const createMockResponse = () => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
  };

  it('calls next() when request body matches schema', async () => {
    const middleware = validateRequest({ body: dummySchema });
    const req = {
      body: { email: 'user@example.com', amount: 150.5 },
    } as Request;
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responds with 400 when request body fails validation', async () => {
    const middleware = validateRequest({ body: dummySchema });
    const req = {
      body: { email: 'invalid-email', amount: -20 },
    } as Request;
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Object),
      })
    );
  });

  it('validates query params when query schema is provided', async () => {
    const querySchema = z.object({
      limit: z.coerce.number().min(1).max(100),
    });
    const middleware = validateRequest({ query: querySchema });

    const req = {
      query: { limit: '25' },
    } as unknown as Request;
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.query).toEqual({ limit: 25 });
  });
});
