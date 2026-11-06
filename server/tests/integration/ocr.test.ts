// server/tests/integration/ocr.test.ts

// Integration tests for receipt upload, MIME validation, and AI OCR extraction.

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { generateAccessToken } from '../../src/utils/tokenUtils.js';
import { createTestUser } from '../fixtures/authFixtures.js';
import { clearTestDb, setupTestDb, teardownTestDb } from '../setupDb.js';

describe('Receipt OCR API (/api/ocr)', () => {
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

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/ocr/receipt');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects upload when no receipt image file is attached', async () => {
    if (!isDbConnected) return;

    const user = await createTestUser({ email: 'ocr_nofile@example.com' });
    const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

    const res = await request(app).post('/api/ocr/receipt').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/file is required/i);
  });

  it('rejects unsupported file mime types', async () => {
    if (!isDbConnected) return;

    const user = await createTestUser({ email: 'ocr_badfile@example.com' });
    const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

    const fakePdfBuffer = Buffer.from('%PDF-1.4 Fake PDF Content');

    const res = await request(app)
      .post('/api/ocr/receipt')
      .set('Authorization', `Bearer ${token}`)
      .attach('receipt', fakePdfBuffer, {
        filename: 'document.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Only JPEG, PNG, and WebP/i);
  });

  it('successfully parses uploaded receipt image and returns structured data', async () => {
    if (!isDbConnected) return;

    const user = await createTestUser({ email: 'ocr_success@example.com' });
    const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

    // 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );

    const res = await request(app)
      .post('/api/ocr/receipt')
      .set('Authorization', `Bearer ${token}`)
      .attach('receipt', pngBuffer, {
        filename: 'receipt.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const data = res.body.data;
    expect(typeof data.vendor).toBe('string');
    expect(typeof data.totalAmount).toBe('number');
    expect(data.totalAmount).toBeGreaterThan(0);
    expect(typeof data.currency).toBe('string');
    expect(data.currency.length).toBe(3);
    expect(typeof data.suggestedCategory).toBe('string');
    expect(Array.isArray(data.items)).toBe(true);
    expect(typeof data.receiptUrl).toBe('string');
  });
});
