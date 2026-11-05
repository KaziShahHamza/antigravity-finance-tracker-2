// client/src/app/(auth)/layout.tsx

// Shared layout for authentication pages providing brand header, theme toggle, and centered card shell.

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Wallet } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      {/* Top Navigation Bar with Brand Link & Theme Toggle */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between sm:top-6 sm:left-8 sm:right-8">
        <Link
          href="/"
          className="focus-ring flex items-center gap-2.5 rounded-lg text-lg font-bold tracking-tight text-fg"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
            <Wallet className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">Antigravity Finance</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Centered Content Container */}
      <main className="w-full max-w-md">{children}</main>

      {/* Footer copyright */}
      <footer className="mt-8 text-center text-xs text-fg-subtle">
        &copy; {new Date().getFullYear()} Antigravity Finance Tracker. All rights reserved.
      </footer>
    </div>
  );
}
