// client/src/lib/__tests__/api.test.ts

// Unit tests for the frontend API client verifying header injection, 401 retry, and error parsing.

import { apiClient, ApiError, getAccessToken, setAccessToken } from '@/lib/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('apiClient', () => {
  beforeEach(() => {
    setAccessToken(null);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('manages access token via setAccessToken and getAccessToken', () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken('mock_access_token_123');
    expect(getAccessToken()).toBe('mock_access_token_123');
  });

  it('injects Bearer authorization header when token is present', async () => {
    setAccessToken('valid_jwt_token');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, data: { status: 'healthy' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiClient<{ status: string }>('/health');

    expect(result).toEqual({ status: 'healthy' });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const requestHeaders = mockFetch.mock.calls[0][1].headers as Headers;
    expect(requestHeaders.get('Authorization')).toBe('Bearer valid_jwt_token');
    expect(requestHeaders.get('Content-Type')).toBe('application/json');
  });

  it('throws ApiError with status and message when server returns error response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          success: false,
          message: 'Invalid credentials',
          errors: { email: ['Email is invalid'] },
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(apiClient('/auth/login')).rejects.toThrow('Invalid credentials');
    await expect(apiClient('/auth/login')).rejects.toBeInstanceOf(ApiError);
  });

  it('attempts token refresh on 401 and retries original request when refresh succeeds', async () => {
    setAccessToken('expired_jwt_token');

    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      callCount++;
      if (callCount === 1) {
        // Initial request returns 401
        return {
          ok: false,
          status: 401,
          text: async () => JSON.stringify({ success: false, message: 'Token expired' }),
        };
      }
      if (url.includes('/auth/refresh')) {
        // Refresh endpoint returns new access token
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              success: true,
              data: { accessToken: 'new_refreshed_jwt_token' },
            }),
        };
      }
      // Retried request succeeds
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: { user: 'verified' } }),
      };
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiClient<{ user: string }>('/users/me');

    expect(result).toEqual({ user: 'verified' });
    expect(getAccessToken()).toBe('new_refreshed_jwt_token');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
