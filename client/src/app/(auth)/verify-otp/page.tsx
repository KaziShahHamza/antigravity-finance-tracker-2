// client/src/app/(auth)/verify-otp/page.tsx

// 6-digit OTP verification screen with auto-advancing inputs, clipboard paste, and 60-second resend cooldown timer.

'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, resendOtp, unverifiedEmail } = useAuth();

  const queryEmail = searchParams.get('email');
  const [email, setEmail] = React.useState(queryEmail || unverifiedEmail || '');
  const [digits, setDigits] = React.useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = React.useState<number>(60);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Keep email in sync if query param or context updates
  React.useEffect(() => {
    if (!email && (queryEmail || unverifiedEmail)) {
      setEmail(queryEmail || unverifiedEmail || '');
    }
  }, [queryEmail, unverifiedEmail, email]);

  // Focus the first input on initial mount
  React.useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Cooldown timer countdown
  React.useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...digits];
      updated[index] = '';
      setDigits(updated);
      return;
    }

    const digit = cleaned.slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);

    // Auto-advance focus to next digit input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const numericChars = pastedText.replace(/\D/g, '').slice(0, 6).split('');

    if (numericChars.length === 0) return;

    const updated = [...digits];
    numericChars.forEach((char, i) => {
      if (i < 6) updated[i] = char;
    });
    setDigits(updated);

    const nextIndex = Math.min(numericChars.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const otpCode = digits.join('');
    if (!email.trim()) {
      setErrorMessage('Please provide your registered email address.');
      return;
    }

    if (otpCode.length !== 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(email.trim(), otpCode);
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please provide your email address to resend the code.');
      return;
    }

    setIsResending(true);
    try {
      await resendOtp(email.trim());
      setSuccessMessage('A new verification code has been sent to your email.');
      setResendCooldown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card
      title="Verify Your Account"
      description="Enter the 6-digit verification code sent to your email."
      className="shadow-md"
    >
      {errorMessage && <Toast variant="error" message={errorMessage} className="mb-4" />}
      {successMessage && <Toast variant="success" message={successMessage} className="mb-4" />}

      <form onSubmit={handleVerify} className="flex flex-col gap-5">
        <Input
          id="verify-email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading || isResending}
        />

        <div className="flex flex-col gap-2">
          <label className="field-label text-center">6-Digit Verification Code</label>
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                id={`otp-digit-${index}`}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                aria-label={`Digit ${index + 1}`}
                className="focus-ring h-12 w-11 rounded-lg border border-border-subtle bg-surface text-center text-xl font-bold text-fg disabled:opacity-50 sm:h-14 sm:w-12"
              />
            ))}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          disabled={isLoading || digits.join('').length !== 6}
          className="w-full"
        >
          Verify & Continue
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-3 text-center text-sm">
        <p className="text-fg-muted">Didn&apos;t receive the code?</p>
        {resendCooldown > 0 ? (
          <span className="text-xs font-medium text-fg-subtle">
            Resend code in {resendCooldown}s
          </span>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResend}
            isLoading={isResending}
            disabled={isResending || !email.trim()}
            className="text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Resend Verification Code
          </Button>
        )}

        <div className="mt-2 w-full border-t border-border-subtle pt-4">
          <Link
            href="/login"
            className="text-xs font-medium text-fg-muted hover:text-fg hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <React.Suspense
      fallback={
        <Card
          title="Verify Your Account"
          description="Loading verification screen..."
          className="shadow-md"
        />
      }
    >
      <VerifyOtpForm />
    </React.Suspense>
  );
}
