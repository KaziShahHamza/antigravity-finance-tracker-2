// client/src/components/landing/HeroSection.tsx

// Hero section for public landing page featuring primary value proposition, CTAs, trust badges, and interactive mockup.

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Wallet,
  Globe,
  BellRing,
  TrendingUp,
  Receipt,
} from 'lucide-react';

export function HeroSection() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && !isLoading && isAuthenticated;

  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        <Badge variant="brand" className="mb-6 px-3 py-1 text-xs gap-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Next-Gen Multi-Currency Financial Management</span>
        </Badge>

        <h1 className="hero-title">
          Take Command of Your Wealth <br className="hidden sm:inline" />
          Across Every Wallet & Currency
        </h1>

        <p className="hero-subtitle">
          Track multi-currency bank accounts and mobile wallets, scan receipts with AI
          auto-categorization, monitor monthly budgets with overspending alerts, and export
          audit-ready statements.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button variant="primary" size="lg" className="shadow-md">
                Go to Your Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register">
                <Button variant="primary" size="lg" className="shadow-md">
                  Start Tracking Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Sign In to Account
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-fg-muted font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Atomic Balance Reconciliation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>100% Client-Side Private Reports</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Zero Spreadsheets Needed</span>
          </div>
        </div>

        {/* Interactive Live Preview Mockup Card */}
        <div className="mt-14 w-full max-w-4xl">
          <div className="rounded-2xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-fg-muted font-mono ml-2">
                  finance-tracker // overview
                </span>
              </div>
              <Badge variant="success">Reconciled & Synced</Badge>
            </div>

            {/* Mock Dashboard Preview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <Card className="p-4 border border-border-subtle bg-surface-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-fg-muted font-medium">Total Net Balance</span>
                  <Wallet className="w-4 h-4 text-brand-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-fg mt-2">$24,850.50</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" /> +12.4% this month
                </div>
              </Card>

              <Card className="p-4 border border-border-subtle bg-surface-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-fg-muted font-medium">Active Wallets</span>
                  <Globe className="w-4 h-4 text-brand-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-fg mt-2">4 Accounts</div>
                <div className="text-xs text-fg-muted mt-1">Bank, bKash, Cash, Credit</div>
              </Card>

              <Card className="p-4 border border-border-subtle bg-surface-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-fg-muted font-medium">Monthly Budget</span>
                  <BellRing className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-fg mt-2">64.5% Used</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                  On track · $1,240 remaining
                </div>
              </Card>
            </div>

            {/* Sample Activity Line */}
            <div className="mt-4 pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-fg-muted">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-600" />
                <span>Latest receipt scanned: Starbucks Coffee — $4.75 (Food & Dining)</span>
              </div>
              <Badge variant="brand">AI Auto-Categorized</Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
