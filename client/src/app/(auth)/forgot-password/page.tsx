// client/src/app/(auth)/forgot-password/page.tsx

// Password recovery request page sending a 6-digit reset code to user's registered email.

'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message || 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      title="Reset Your Password"
      description="Enter the email associated with your account and we'll send a 6-digit reset code."
      className="shadow-md"
    >
      {errorMessage && <Toast variant="error" message={errorMessage} className="mb-4" />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="forgot-email"
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="mt-2 w-full"
        >
          Send Reset Code
        </Button>
      </form>

      <div className="mt-6 border-t border-border-subtle pt-4 text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
        >
          Remember your password? Sign in
        </Link>
      </div>
    </Card>
  );
}
