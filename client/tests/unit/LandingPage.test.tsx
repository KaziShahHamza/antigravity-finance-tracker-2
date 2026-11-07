// client/tests/unit/LandingPage.test.tsx

// Unit tests for public HomePage landing component verifying feature showcase, hero layout, and auth state CTAs.

import HomePage from '@/app/page';
import { AuthContextType } from '@/context/AuthContext';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const mockAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  unverifiedEmail: null,
  login: vi.fn(),
  register: vi.fn(),
  verifyOtp: vi.fn(),
  resendOtp: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
  setUnverifiedEmail: vi.fn(),
  updateUser: vi.fn(),
  refreshUser: vi.fn(),
};

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

vi.mock('@/components/layout/ThemeToggle', () => ({
  ThemeToggle: () => <button aria-label="Toggle theme">Theme</button>,
}));

describe('HomePage Landing Component', () => {
  it('renders brand heading and key feature highlights', () => {
    render(<HomePage />);

    expect(screen.getAllByText('Finance Tracker').length).toBeGreaterThan(0);
    expect(screen.getByText(/Take Command of Your Wealth/i)).toBeDefined();
    expect(screen.getByText('Multi-Currency Wallets')).toBeDefined();
    expect(screen.getByText('AI Receipt Scanning (OCR)')).toBeDefined();
    expect(screen.getByText('Budgets & Overspending Alerts')).toBeDefined();
    expect(screen.getByText('Visual Cash Flow Analytics')).toBeDefined();
    expect(screen.getByText('Atomic Balance Transfers')).toBeDefined();
    expect(screen.getByText('Client-Side CSV & PDF Reports')).toBeDefined();
  });

  it('renders unauthenticated guest CTA buttons', () => {
    render(<HomePage />);

    expect(screen.getByRole('link', { name: /Start Tracking Free/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Sign In to Account/i })).toBeDefined();
  });
});
