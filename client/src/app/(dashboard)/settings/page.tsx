// client/src/app/(dashboard)/settings/page.tsx

// User settings page for profile management, currency/theme preferences, password updates, and demo data seeding.

'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import type { ThemePreference, User } from '@/types';
import {
  CheckCircle2,
  Database,
  KeyRound,
  Palette,
  ShieldAlert,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($) - United States Dollar' },
  { value: 'BDT', label: 'BDT (৳) - Bangladeshi Taka' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
  { value: 'CAD', label: 'CAD ($) - Canadian Dollar' },
  { value: 'AUD', label: 'AUD ($) - Australian Dollar' },
  { value: 'JPY', label: 'JPY (¥) - Japanese Yen' },
];

const THEME_OPTIONS = [
  { value: 'system', label: 'System Default' },
  { value: 'light', label: 'Light Mode' },
  { value: 'dark', label: 'Dark Mode' },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { setTheme } = useTheme();

  // Profile Form State
  const [name, setName] = React.useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileMessage, setProfileMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Preferences Form State
  const [defaultCurrency, setDefaultCurrency] = React.useState(user?.defaultCurrency || 'USD');
  const [themePreference, setThemePreference] = React.useState<ThemePreference>(
    user?.themePreference || 'system'
  );
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = React.useState<string>(
    user?.monthlyBudgetLimit !== undefined && user?.monthlyBudgetLimit !== null
      ? String(user.monthlyBudgetLimit)
      : ''
  );
  const [isSavingPreferences, setIsSavingPreferences] = React.useState(false);
  const [preferencesMessage, setPreferencesMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);
  const [passwordMessage, setPasswordMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Demo Data State
  const [isLoadingDemo, setIsLoadingDemo] = React.useState(false);
  const [demoMessage, setDemoMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Synchronize fields when user updates
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setDefaultCurrency(user.defaultCurrency);
      setThemePreference(user.themePreference);
      setMonthlyBudgetLimit(
        user.monthlyBudgetLimit !== undefined && user.monthlyBudgetLimit !== null
          ? String(user.monthlyBudgetLimit)
          : ''
      );
    }
  }, [user]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (name.trim().length < 2) {
      setProfileMessage({ type: 'error', text: 'Name must be at least 2 characters.' });
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await apiClient<{ success: boolean; user: User }>('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      });
      updateUser(res.user);
      setProfileMessage({ type: 'success', text: 'Profile name updated successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      setProfileMessage({ type: 'error', text: message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Preferences Update
  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreferencesMessage(null);

    const limitNumber = monthlyBudgetLimit.trim() === '' ? null : parseFloat(monthlyBudgetLimit);

    if (limitNumber !== null && (isNaN(limitNumber) || limitNumber < 0)) {
      setPreferencesMessage({
        type: 'error',
        text: 'Monthly budget limit must be a valid non-negative number.',
      });
      return;
    }

    setIsSavingPreferences(true);
    try {
      const res = await apiClient<{ success: boolean; user: User }>('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          defaultCurrency,
          themePreference,
          monthlyBudgetLimit: limitNumber,
        }),
      });

      updateUser(res.user);
      setTheme(themePreference);
      setPreferencesMessage({ type: 'success', text: 'Preferences updated successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update preferences.';
      setPreferencesMessage({ type: 'error', text: message });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      });
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must contain at least 1 letter and 1 number.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must be different from your current password.',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await apiClient('/users/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordMessage({
        type: 'success',
        text: 'Password changed successfully. Please remember your new password.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password.';
      setPasswordMessage({ type: 'error', text: message });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Load Demo Data
  const handleLoadDemoData = async () => {
    setDemoMessage(null);
    setIsLoadingDemo(true);
    try {
      const res = await apiClient<{
        success: boolean;
        message: string;
        data: { accountsCreated: number; budgetsCreated: number; transactionsCreated: number };
      }>('/users/demo-data', {
        method: 'POST',
      });
      setDemoMessage({
        type: 'success',
        text: `Loaded ${res.data.accountsCreated} accounts, ${res.data.budgetsCreated} budgets, and ${res.data.transactionsCreated} demo transactions!`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load demo data.';
      setDemoMessage({ type: 'error', text: message });
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-fg">Account Settings</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Manage your personal profile, regional preferences, security, and demo data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Profile Information Card */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <span>Personal Profile</span>
            </span>
          }
          description="Update your personal details and view verification status."
        >
          {profileMessage && (
            <Toast variant={profileMessage.type} message={profileMessage.text} className="mb-4" />
          )}

          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white shadow-sm">
              {userInitial}
            </div>
            <div>
              <p className="font-semibold text-fg">{user?.name || 'User'}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-fg-muted">{user?.email}</span>
                <Badge variant={user?.isVerified ? 'success' : 'warning'} className="gap-1">
                  {user?.isVerified && <CheckCircle2 className="h-3 w-3" />}
                  {user?.isVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
            <Input
              id="settings-name"
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSavingProfile}
              required
            />

            <Input
              id="settings-email"
              label="Email Address"
              type="email"
              value={user?.email || ''}
              disabled
              hint="Account email address cannot be modified."
            />

            <div className="mt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingProfile}
                disabled={isSavingProfile || name.trim() === user?.name}
              >
                Save Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* 2. Preferences Card */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <span>Regional & Theme Preferences</span>
            </span>
          }
          description="Configure currency format, theme appearance, and spending threshold."
        >
          {preferencesMessage && (
            <Toast
              variant={preferencesMessage.type}
              message={preferencesMessage.text}
              className="mb-4"
            />
          )}

          <form onSubmit={handlePreferencesSubmit} className="flex flex-col gap-4">
            <Select
              id="settings-currency"
              label="Default Base Currency"
              options={CURRENCY_OPTIONS}
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              disabled={isSavingPreferences}
              hint="All transactions and wallet totals will automatically convert to this currency."
            />

            <Select
              id="settings-theme"
              label="Color Theme"
              options={THEME_OPTIONS}
              value={themePreference}
              onChange={(e) => setThemePreference(e.target.value as ThemePreference)}
              disabled={isSavingPreferences}
            />

            <Input
              id="settings-budget-limit"
              label="Monthly Spending Threshold (Optional)"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 2500"
              value={monthlyBudgetLimit}
              onChange={(e) => setMonthlyBudgetLimit(e.target.value)}
              disabled={isSavingPreferences}
              hint="Triggers warning alerts on your dashboard when monthly expenses exceed this limit."
            />

            <div className="mt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingPreferences}
                disabled={isSavingPreferences}
              >
                Save Preferences
              </Button>
            </div>
          </form>
        </Card>

        {/* 3. Security & Password Card */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <span>Change Password</span>
            </span>
          }
          description="Update your password to keep your financial account safe."
        >
          {passwordMessage && (
            <Toast variant={passwordMessage.type} message={passwordMessage.text} className="mb-4" />
          )}

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <Input
              id="settings-current-password"
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isUpdatingPassword}
              required
            />

            <Input
              id="settings-new-password"
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isUpdatingPassword}
              required
              hint="Minimum 8 characters with 1 letter and 1 number."
            />

            <Input
              id="settings-confirm-password"
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isUpdatingPassword}
              required
            />

            <div className="mt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isUpdatingPassword}
                disabled={isUpdatingPassword || !currentPassword || !newPassword}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Card>

        {/* 4. Demo Data Seeder Card */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>Demo Financial Data</span>
            </span>
          }
          description="Populate realistic sample accounts, budgets, and transactions."
        >
          {demoMessage && (
            <Toast variant={demoMessage.type} message={demoMessage.text} className="mb-4" />
          )}

          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border-subtle bg-surface-muted/50 p-4 text-sm text-fg-muted">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
                <div>
                  <p className="font-semibold text-fg">Sample Workspace Data</p>
                  <p className="mt-1 text-xs">
                    Seeds 4 accounts (Cash, Bank Checking, bKash, Credit Card), 4 category budgets,
                    and 12+ realistic transactions over the last 30 days. Perfect for exploring
                    charts, analytics, and filters.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border-subtle pt-4">
              <span className="text-xs text-fg-subtle">
                Safe to load at any time without overwriting your profile.
              </span>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleLoadDemoData}
                isLoading={isLoadingDemo}
                disabled={isLoadingDemo}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Load Demo Data</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
