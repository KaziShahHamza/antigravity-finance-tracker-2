// client/src/app/(auth)/register/page.tsx

// User registration page with client-side validation, currency selection, and OTP redirection.

'use client';

import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [defaultCurrency, setDefaultCurrency] = React.useState('USD');

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (name.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      setErrorMessage('Password must contain at least 1 letter and 1 number.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password, defaultCurrency);
      router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      title="Create Account"
      description="Start tracking your expenses and multi-currency wallets today."
      className="shadow-md"
    >
      {errorMessage && <Toast variant="error" message={errorMessage} className="mb-4" />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="register-name"
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Alex Doe"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />

        <Input
          id="register-email"
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="register-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            hint="Min. 8 chars (1 letter & 1 number)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          <Input
            id="register-confirm-password"
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Select
          id="register-currency"
          label="Default Currency"
          options={CURRENCY_OPTIONS}
          value={defaultCurrency}
          onChange={(e) => setDefaultCurrency(e.target.value)}
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="mt-2 w-full"
        >
          Create Account
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
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
        >
          Sign in
        </Link>
      </p>
    </Card>
  );
}
