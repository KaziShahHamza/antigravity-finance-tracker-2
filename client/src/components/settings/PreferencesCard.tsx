// client/src/components/settings/PreferencesCard.tsx

// Regional and theme preferences settings card managing base currency, color theme, and monthly spending threshold.

'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import type { ThemePreference, User } from '@/types';
import { Palette } from 'lucide-react';
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

export function PreferencesCard() {
  const { user, updateUser } = useAuth();
  const { setTheme } = useTheme();

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

  React.useEffect(() => {
    if (user) {
      setDefaultCurrency(user.defaultCurrency);
      setThemePreference(user.themePreference);
      setMonthlyBudgetLimit(
        user.monthlyBudgetLimit !== undefined && user.monthlyBudgetLimit !== null
          ? String(user.monthlyBudgetLimit)
          : ''
      );
    }
  }, [user]);

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

  return (
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
  );
}
