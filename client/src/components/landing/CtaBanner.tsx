// client/src/components/landing/CtaBanner.tsx

// Bottom conversion call-to-action banner linking users to registration or dashboard.

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { ChevronRight } from 'lucide-react';

export function CtaBanner() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && !isLoading && isAuthenticated;

  return (
    <section className="landing-section border-t border-border-subtle text-center">
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-fg">
          Ready to Take Command of Your Finances?
        </h2>
        <p className="text-base text-fg-muted max-w-xl mx-auto">
          Get started in under 60 seconds. Set up your wallets, track expenses, and stay on budget
          effortlessly.
        </p>
        <div className="pt-2">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button variant="primary" size="lg" className="shadow-lg">
                Return to Dashboard
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button variant="primary" size="lg" className="shadow-lg">
                Create Your Free Account
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
