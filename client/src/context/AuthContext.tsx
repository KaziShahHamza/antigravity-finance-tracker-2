// client/src/context/AuthContext.tsx

// React context provider managing user authentication state, session tokens, login/logout, and OTP flows.

'use client';

import { apiClient, setAccessToken, setRefreshToken } from '@/lib/api';
import type { User } from '@/types';
import * as React from 'react';

interface AuthResponse {
  success: boolean;
  message?: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  unverifiedEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    defaultCurrency?: string
  ) => Promise<RegisterResponse>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  setUnverifiedEmail: (email: string | null) => void;
}

const STORAGE_KEYS = {
  REFRESH_TOKEN: 'aft_refresh_token',
  USER: 'aft_user',
  UNVERIFIED_EMAIL: 'aft_unverified_email',
} as const;

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [unverifiedEmail, setUnverifiedEmailState] = React.useState<string | null>(null);

  const setUnverifiedEmail = React.useCallback((email: string | null) => {
    setUnverifiedEmailState(email);
    if (typeof window !== 'undefined') {
      if (email) {
        localStorage.setItem(STORAGE_KEYS.UNVERIFIED_EMAIL, email);
      } else {
        localStorage.removeItem(STORAGE_KEYS.UNVERIFIED_EMAIL);
      }
    }
  }, []);

  const handleAuthSuccess = React.useCallback(
    (authData: AuthResponse) => {
      setAccessToken(authData.accessToken);
      setRefreshToken(authData.refreshToken);
      setUser(authData.user);
      setUnverifiedEmail(null);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user));
      }
    },
    [setUnverifiedEmail]
  );

  const clearAuthSession = React.useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, []);

  // Hydrate session from localStorage and refresh token on mount
  React.useEffect(() => {
    const hydrateSession = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const storedEmail = localStorage.getItem(STORAGE_KEYS.UNVERIFIED_EMAIL);
      if (storedEmail) {
        setUnverifiedEmailState(storedEmail);
      }

      const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

      if (!storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        setRefreshToken(storedRefreshToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // Non-fatal if cached user JSON was malformed
          }
        }

        const refreshed = await apiClient<{ accessToken: string; refreshToken?: string }>(
          '/auth/refresh',
          {
            method: 'POST',
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
            skipAuth: true,
          }
        );

        if (refreshed.accessToken) {
          setAccessToken(refreshed.accessToken);
          if (refreshed.refreshToken) {
            setRefreshToken(refreshed.refreshToken);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshed.refreshToken);
          }
        }
      } catch {
        clearAuthSession();
      } finally {
        setIsLoading(false);
      }
    };

    hydrateSession();
  }, [clearAuthSession]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      try {
        const response = await apiClient<AuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
          skipAuth: true,
        });
        handleAuthSuccess(response);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '';
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 403 || message.toLowerCase().includes('not verified')) {
          setUnverifiedEmail(email);
        }
        throw err;
      }
    },
    [handleAuthSuccess, setUnverifiedEmail]
  );

  const register = React.useCallback(
    async (name: string, email: string, password: string, defaultCurrency = 'USD') => {
      const response = await apiClient<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, defaultCurrency }),
        skipAuth: true,
      });
      setUnverifiedEmail(email);
      return response;
    },
    [setUnverifiedEmail]
  );

  const verifyOtp = React.useCallback(
    async (email: string, otp: string) => {
      const response = await apiClient<AuthResponse>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
        skipAuth: true,
      });
      handleAuthSuccess(response);
    },
    [handleAuthSuccess]
  );

  const resendOtp = React.useCallback(async (email: string) => {
    await apiClient('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  }, []);

  const forgotPassword = React.useCallback(async (email: string) => {
    await apiClient('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  }, []);

  const resetPassword = React.useCallback(
    async (email: string, otp: string, newPassword: string) => {
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
        skipAuth: true,
      });
    },
    []
  );

  const loginWithGoogle = React.useCallback(
    async (credential: string) => {
      const response = await apiClient<AuthResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
        skipAuth: true,
      });
      handleAuthSuccess(response);
    },
    [handleAuthSuccess]
  );

  const logout = React.useCallback(async () => {
    const currentRefreshToken =
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) : null;
    try {
      await apiClient('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });
    } catch {
      // Proceed with local clearance even if remote logout fails
    } finally {
      clearAuthSession();
    }
  }, [clearAuthSession]);

  const value = React.useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user && user.isVerified),
      unverifiedEmail,
      login,
      register,
      verifyOtp,
      resendOtp,
      forgotPassword,
      resetPassword,
      loginWithGoogle,
      logout,
      setUnverifiedEmail,
    }),
    [
      user,
      isLoading,
      unverifiedEmail,
      login,
      register,
      verifyOtp,
      resendOtp,
      forgotPassword,
      resetPassword,
      loginWithGoogle,
      logout,
      setUnverifiedEmail,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
