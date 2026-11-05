// client/src/app/(auth)/login/page.tsx

// User login page with email/password authentication, Google OAuth button, and unverified-user redirection.

'use client';

import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Check if routed after password reset or signup
  const resetSuccess = searchParams.get('reset') === 'success';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorObj = err as { statusCode?: number; message?: string };
      const message = errorObj.message || 'Invalid email or password.';

      if (errorObj.statusCode === 403 || message.toLowerCase().includes('not verified')) {
        router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
        return;
      }

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      title="Welcome Back"
      description="Sign in to your account to manage your finances."
      className="shadow-md"
    >
      {resetSuccess && (
        <Toast
          variant="success"
          message="Password reset successfully. Please sign in with your new password."
          className="mb-4"
        />
      )}

      {errorMessage && <Toast variant="error" message={errorMessage} className="mb-4" />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="login-email"
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="field-label">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="field-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="mt-2 w-full"
        >
          Sign In
        </Button>
      </form>

      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-subtle" />
        </div>
        <span className="relative bg-surface px-3 text-xs uppercase tracking-wider text-fg-subtle">
          Or continue with
        </span>
      </div>

      <GoogleSignInButton
        onSuccess={() => router.push('/dashboard')}
        onError={(err) => setErrorMessage(err)}
        disabled={isLoading}
      />

      <p className="mt-6 text-center text-sm text-fg-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
        >
          Sign up
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <Card title="Welcome Back" description="Loading authentication..." className="shadow-md" />
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
