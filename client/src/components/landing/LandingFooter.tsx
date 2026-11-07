// client/src/components/landing/LandingFooter.tsx

// Public footer containing branding, quick app navigation links, and copyright info.

import * as React from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-border-subtle bg-surface py-8 text-sm text-fg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-semibold text-fg">
          <TrendingUp className="w-4 h-4 text-brand-600" />
          <span>Finance Tracker</span>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <Link href="/dashboard" className="hover:text-fg transition-colors">
            Dashboard
          </Link>
          <Link href="/accounts" className="hover:text-fg transition-colors">
            Wallets
          </Link>
          <Link href="/transactions" className="hover:text-fg transition-colors">
            Transactions
          </Link>
          <Link href="/budgets" className="hover:text-fg transition-colors">
            Budgets
          </Link>
        </div>

        <div className="text-xs text-fg-subtle">
          &copy; {new Date().getFullYear()} Finance Tracker. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
