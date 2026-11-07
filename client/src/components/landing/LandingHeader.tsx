// client/src/components/landing/LandingHeader.tsx

// Sticky public landing navigation header with brand branding, anchor links, theme toggle, and auth CTAs.

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { TrendingUp, ArrowRight } from 'lucide-react';

export function LandingHeader() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && !isLoading && isAuthenticated;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-fg">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span>Finance Tracker</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-fg-muted">
          <a href="#features" className="hover:text-fg transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-fg transition-colors">
            How It Works
          </a>
          <a href="#security" className="hover:text-fg transition-colors">
            Security
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button variant="primary" size="sm">
                Dashboard
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
