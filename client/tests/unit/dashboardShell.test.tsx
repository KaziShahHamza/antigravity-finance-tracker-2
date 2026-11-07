// client/tests/unit/dashboardShell.test.tsx

// Unit tests for Sidebar, Navbar, and DashboardLayout shell components.

import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import DashboardLayout from '@/app/(dashboard)/layout';
import { useAuth } from '@/context/AuthContext';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/dashboard'),
}));

describe('Dashboard Shell Components', () => {
  const mockLogout = vi.fn();
  const mockReplace = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  describe('Sidebar', () => {
    it('renders all core navigation items and brand title', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          isVerified: true,
          defaultCurrency: 'USD',
          themePreference: 'system',
        },
        isAuthenticated: true,
        isLoading: false,
        unverifiedEmail: null,
        login: vi.fn(),
        register: vi.fn(),
        verifyOtp: vi.fn(),
        resendOtp: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithGoogle: vi.fn(),
        logout: mockLogout,
        setUnverifiedEmail: vi.fn(),
        updateUser: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(<Sidebar />);

      expect(screen.getByText('Finance Tracker')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Accounts')).toBeInTheDocument();
      expect(screen.getByText('Transactions')).toBeInTheDocument();
      expect(screen.getByText('Budgets')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Navbar', () => {
    it('renders page heading and handles sign out click', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          isVerified: true,
          defaultCurrency: 'USD',
          themePreference: 'system',
        },
        isAuthenticated: true,
        isLoading: false,
        unverifiedEmail: null,
        login: vi.fn(),
        register: vi.fn(),
        verifyOtp: vi.fn(),
        resendOtp: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithGoogle: vi.fn(),
        logout: mockLogout,
        setUnverifiedEmail: vi.fn(),
        updateUser: vi.fn(),
        refreshUser: vi.fn(),
      });

      const onOpenMobileNav = vi.fn();
      render(<Navbar onOpenMobileNav={onOpenMobileNav} />);

      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
      expect(screen.getByText(/Signed in as/)).toBeInTheDocument();

      const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
      await act(async () => {
        fireEvent.click(signOutBtn);
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('DashboardLayout', () => {
    it('redirects to /login when user is not authenticated and loading is complete', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        unverifiedEmail: null,
        login: vi.fn(),
        register: vi.fn(),
        verifyOtp: vi.fn(),
        resendOtp: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithGoogle: vi.fn(),
        logout: mockLogout,
        setUnverifiedEmail: vi.fn(),
        updateUser: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <DashboardLayout>
          <div>Protected Content</div>
        </DashboardLayout>
      );

      expect(mockReplace).toHaveBeenCalledWith('/login');
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders children and shell when authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          isVerified: true,
          defaultCurrency: 'USD',
          themePreference: 'system',
        },
        isAuthenticated: true,
        isLoading: false,
        unverifiedEmail: null,
        login: vi.fn(),
        register: vi.fn(),
        verifyOtp: vi.fn(),
        resendOtp: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithGoogle: vi.fn(),
        logout: mockLogout,
        setUnverifiedEmail: vi.fn(),
        updateUser: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <DashboardLayout>
          <div>Protected Content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    });
  });
});
