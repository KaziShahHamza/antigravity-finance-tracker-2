// client/tests/unit/AuthContext.test.tsx

// Unit tests for AuthContext verifying session lifecycle, storage persistence, and auth operations.

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '@/lib/api';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUser = {
  id: 'user_123',
  name: 'Alex Doe',
  email: 'alex@example.com',
  isVerified: true,
  defaultCurrency: 'USD',
  themePreference: 'system' as const,
};

describe('AuthContext & AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with unauthenticated state when localStorage is empty', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.unverifiedEmail).toBeNull();
  });

  it('rehydrates user and session when valid refresh token exists in localStorage', async () => {
    localStorage.setItem('aft_refresh_token', 'stored_refresh_token');
    localStorage.setItem('aft_user', JSON.stringify(mockUser));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
          accessToken: 'new_fresh_access_token',
          refreshToken: 'new_fresh_refresh_token',
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('alex@example.com');
    expect(getAccessToken()).toBe('new_fresh_access_token');
    expect(getRefreshToken()).toBe('new_fresh_refresh_token');
  });

  it('performs login and stores session on success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
          accessToken: 'jwt_access_123',
          refreshToken: 'jwt_refresh_123',
          user: mockUser,
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login('alex@example.com', 'Password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe('user_123');
    expect(getAccessToken()).toBe('jwt_access_123');
    expect(localStorage.getItem('aft_refresh_token')).toBe('jwt_refresh_123');
  });

  it('captures unverifiedEmail when login fails with 403 unverified error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () =>
        JSON.stringify({
          success: false,
          message: 'Email not verified. Please verify your email with the 6-digit code.',
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.login('unverified@example.com', 'Password123');
      } catch {
        // Expected rejection
      }
    });

    expect(result.current.unverifiedEmail).toBe('unverified@example.com');
    expect(localStorage.getItem('aft_unverified_email')).toBe('unverified@example.com');
  });

  it('records unverifiedEmail on successful registration', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          success: true,
          message: 'Registration successful.',
          email: 'newuser@example.com',
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.register('New User', 'newuser@example.com', 'Password123', 'USD');
    });

    expect(result.current.unverifiedEmail).toBe('newuser@example.com');
  });

  it('clears state and storage on logout', async () => {
    localStorage.setItem('aft_refresh_token', 'token_to_remove');
    localStorage.setItem('aft_user', JSON.stringify(mockUser));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, message: 'Logged out successfully.' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('aft_refresh_token')).toBeNull();
  });

  it('throws descriptive error when useAuth is consumed outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
  });
});
