// client/src/lib/authStorage.ts

// Type-safe localStorage persistence utilities for tokens, user session cache, and verification state.

import type { User } from '@/types';

export const STORAGE_KEYS = {
  REFRESH_TOKEN: 'aft_refresh_token',
  USER: 'aft_user',
  UNVERIFIED_EMAIL: 'aft_unverified_email',
} as const;

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function setStoredRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function getStoredUnverifiedEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.UNVERIFIED_EMAIL);
}

export function setStoredUnverifiedEmail(email: string | null): void {
  if (typeof window === 'undefined') return;
  if (email) {
    localStorage.setItem(STORAGE_KEYS.UNVERIFIED_EMAIL, email);
  } else {
    localStorage.removeItem(STORAGE_KEYS.UNVERIFIED_EMAIL);
  }
}

export function clearAllAuthStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}
