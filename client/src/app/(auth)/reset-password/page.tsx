// client/src/app/(auth)/reset-password/page.tsx

// Password reset submission page verifying 6-digit reset OTP and setting a new password.

'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();

  const queryEmail = searchParams.get('email');
  const [email, setEmail] = React.useState(queryEmail || '');
  const [otp, setOtp] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!email && queryEmail) {
      setEmail(queryEmail);
    }
  }, [queryEmail, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please provide your email address.');
      return;
    }

    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit reset code.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setErrorMessage('Password must contain at least 1 letter and 1 number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email.trim(), cleanOtp, newPassword);
      router.push('/login?reset=success');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(
        errorObj.message || 'Failed to reset password. The code may be invalid or expired.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      title="Create New Password"
      description="Enter the 6-digit code sent to your email and your new password."
      className="shadow-md"
    >
      {errorMessage && <Toast variant="error" message={errorMessage} className="mb-4" />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="reset-email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />

        <Input
          id="reset-otp"
          label="6-Digit Reset Code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          disabled={isLoading}
        />

        <Input
          id="reset-new-password"
          label="New Password"
          type="password"
          placeholder="••••••••"
          required
          hint="Min. 8 characters (1 letter & 1 number)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isLoading}
        />

        <Input
          id="reset-confirm-password"
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="mt-2 w-full"
        >
          Reset Password
        </Button>
      </form>

      <div className="mt-6 border-t border-border-subtle pt-4 text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
        >
          Back to Sign In
        </Link>
      </div>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <Card
          title="Create New Password"
          description="Loading reset screen..."
          className="shadow-md"
        />
      }
    >
      <ResetPasswordForm />
    </React.Suspense>
  );
}
