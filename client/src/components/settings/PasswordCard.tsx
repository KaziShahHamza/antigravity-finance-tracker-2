// client/src/components/settings/PasswordCard.tsx

// Password update settings card providing current password verification, new password validation, and change submission.

'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api';
import { KeyRound } from 'lucide-react';
import * as React from 'react';

export function PasswordCard() {
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);
  const [passwordMessage, setPasswordMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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

  return (
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
  );
}
