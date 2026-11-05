// client/tests/unit/settingsPage.test.tsx

// Unit tests for the User Settings page, verifying profile updates, preferences, password changes, and demo data trigger.

import SettingsPage from '@/app/(dashboard)/settings/page';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useTheme } from 'next-themes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiClient: vi.fn(),
}));

describe('SettingsPage Component', () => {
  const mockUpdateUser = vi.fn();
  const mockSetTheme = vi.fn();

  const mockUser = {
    id: 'user-123',
    name: 'Hamza Doe',
    email: 'hamza@example.com',
    isVerified: true,
    defaultCurrency: 'USD',
    themePreference: 'system' as const,
    monthlyBudgetLimit: 1500,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
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
      logout: vi.fn(),
      setUnverifiedEmail: vi.fn(),
      updateUser: mockUpdateUser,
      refreshUser: vi.fn(),
    });

    vi.mocked(useTheme).mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
    });
  });

  it('renders initial user profile data and badge', () => {
    render(<SettingsPage />);

    expect(screen.getByRole('heading', { name: 'Account Settings' })).toBeInTheDocument();
    expect(screen.getByText('Hamza Doe')).toBeInTheDocument();
    expect(screen.getByText('hamza@example.com')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Full Name') as HTMLInputElement;
    expect(nameInput.value).toBe('Hamza Doe');

    const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
    expect(emailInput.value).toBe('hamza@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('validates profile name length before submitting', async () => {
    render(<SettingsPage />);

    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'A' } });

    const saveButton = screen.getByRole('button', { name: 'Save Profile' });
    fireEvent.click(saveButton);

    expect(await screen.findByText('Name must be at least 2 characters.')).toBeInTheDocument();
    expect(apiClient).not.toHaveBeenCalled();
  });

  it('successfully updates user profile name', async () => {
    const updatedUser = { ...mockUser, name: 'Hamza Smith' };
    vi.mocked(apiClient).mockResolvedValueOnce({
      success: true,
      user: updatedUser,
    });

    render(<SettingsPage />);

    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'Hamza Smith' } });

    const saveButton = screen.getByRole('button', { name: 'Save Profile' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Hamza Smith' }),
      });
      expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser);
      expect(screen.getByText('Profile name updated successfully.')).toBeInTheDocument();
    });
  });

  it('validates budget limit and submits preference updates', async () => {
    const updatedUser = {
      ...mockUser,
      defaultCurrency: 'BDT',
      themePreference: 'dark' as const,
      monthlyBudgetLimit: 2000,
    };
    vi.mocked(apiClient).mockResolvedValueOnce({
      success: true,
      user: updatedUser,
    });

    render(<SettingsPage />);

    const currencySelect = screen.getByLabelText('Default Base Currency');
    fireEvent.change(currencySelect, { target: { value: 'BDT' } });

    const themeSelect = screen.getByLabelText('Color Theme');
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    const budgetInput = screen.getByLabelText('Monthly Spending Threshold (Optional)');
    fireEvent.change(budgetInput, { target: { value: '2000' } });

    const savePrefButton = screen.getByRole('button', { name: 'Save Preferences' });
    fireEvent.click(savePrefButton);

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          defaultCurrency: 'BDT',
          themePreference: 'dark',
          monthlyBudgetLimit: 2000,
        }),
      });
      expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      expect(screen.getByText('Preferences updated successfully.')).toBeInTheDocument();
    });
  });

  it('validates password requirements before changing password', async () => {
    render(<SettingsPage />);

    const currentPwdInput = screen.getByLabelText('Current Password');
    const newPwdInput = screen.getByLabelText('New Password');
    const confirmPwdInput = screen.getByLabelText('Confirm New Password');

    // Case 1: Short password
    fireEvent.change(currentPwdInput, { target: { value: 'oldpassword123' } });
    fireEvent.change(newPwdInput, { target: { value: 'short' } });
    fireEvent.change(confirmPwdInput, { target: { value: 'short' } });

    const updatePwdButton = screen.getByRole('button', { name: 'Update Password' });
    fireEvent.click(updatePwdButton);

    expect(
      await screen.findByText('New password must be at least 8 characters long.')
    ).toBeInTheDocument();

    // Case 2: Mismatched passwords
    fireEvent.change(newPwdInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPwdInput, { target: { value: 'different123' } });
    fireEvent.click(updatePwdButton);

    expect(await screen.findByText('New passwords do not match.')).toBeInTheDocument();

    // Case 3: Same as current
    fireEvent.change(newPwdInput, { target: { value: 'oldpassword123' } });
    fireEvent.change(confirmPwdInput, { target: { value: 'oldpassword123' } });
    fireEvent.click(updatePwdButton);

    expect(
      await screen.findByText('New password must be different from your current password.')
    ).toBeInTheDocument();
  });

  it('successfully changes password and clears form inputs', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      success: true,
      message: 'Password changed successfully.',
    });

    render(<SettingsPage />);

    const currentPwdInput = screen.getByLabelText('Current Password') as HTMLInputElement;
    const newPwdInput = screen.getByLabelText('New Password') as HTMLInputElement;
    const confirmPwdInput = screen.getByLabelText('Confirm New Password') as HTMLInputElement;

    fireEvent.change(currentPwdInput, { target: { value: 'currentPass1' } });
    fireEvent.change(newPwdInput, { target: { value: 'newSecurePass2' } });
    fireEvent.change(confirmPwdInput, { target: { value: 'newSecurePass2' } });

    const updatePwdButton = screen.getByRole('button', { name: 'Update Password' });
    fireEvent.click(updatePwdButton);

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/users/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: 'currentPass1',
          newPassword: 'newSecurePass2',
        }),
      });
      expect(screen.getByText(/Password changed successfully/i)).toBeInTheDocument();
      expect(currentPwdInput.value).toBe('');
      expect(newPwdInput.value).toBe('');
      expect(confirmPwdInput.value).toBe('');
    });
  });

  it('triggers demo data generation and displays success message', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      success: true,
      message: 'Demo financial data successfully loaded.',
      data: {
        accountsCreated: 4,
        budgetsCreated: 4,
        transactionsCreated: 14,
      },
    });

    render(<SettingsPage />);

    const loadDemoButton = screen.getByRole('button', { name: 'Load Demo Data' });
    fireEvent.click(loadDemoButton);

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/users/demo-data', {
        method: 'POST',
      });
      expect(
        screen.getByText('Loaded 4 accounts, 4 budgets, and 14 demo transactions!')
      ).toBeInTheDocument();
    });
  });
});
