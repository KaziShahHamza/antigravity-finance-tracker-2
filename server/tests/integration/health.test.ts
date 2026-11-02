// Integration test verifying Express app bootstrapping, security headers, 404 handler, and /api/health.
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';

describe('GET /api/health integration', () => {
  it('returns 200 with healthy status and metadata', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      status: 'healthy',
      environment: expect.any(String),
    });
    expect(response.body.timestamp).toBeDefined();
    expect(typeof response.body.uptime).toBe('number');
  });

  it('sets secure HTTP response headers from Helmet', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('returns 404 for undefined routes', async () => {
    const response = await request(app).get('/api/unknown-endpoint');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Resource not found',
    });
  });
});
