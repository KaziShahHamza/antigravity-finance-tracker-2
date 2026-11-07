// client/src/app/page.tsx

// Modern responsive public landing page with feature showcase, hero section, interactive preview, and auth CTAs.

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  Wallet,
  Receipt,
  PieChart,
  ArrowRightLeft,
  ShieldCheck,
  FileSpreadsheet,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Lock,
  BarChart3,
  ChevronRight,
  Globe,
  BellRing,
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && !isLoading && isAuthenticated;

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col selection:bg-brand-500/20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-fg">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span>Antigravity Finance</span>
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

      {/* Hero Section */}
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
                    antigravity-finance // overview
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

      {/* Features Grid Section */}
      <section id="features" className="landing-section border-t border-border-subtle">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="brand" className="mb-3">
            Capabilities
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Engineered for Precision & Financial Freedom
          </h2>
          <p className="mt-4 text-fg-muted">
            Everything you need to handle real-world personal finances, from physical paper receipts
            to multi-currency mobile wallets.
          </p>
        </div>

        <div className="landing-grid">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-fg">Multi-Currency Wallets</h3>
            <p className="text-sm text-fg-muted leading-relaxed">
              Track checking accounts, cash, credit cards, bKash, and Nagad wallets in USD, BDT,
              EUR, GBP, or any global currency with live exchange rates.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-fg">AI Receipt Scanning (OCR)</h3>
            <p className="text-sm text-fg-muted leading-relaxed">
              Snap receipt photos on your phone or desktop. Our OCR pipeline automatically extracts
              the vendor, date, line items, and amount with zero manual typing.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-fg">Budgets & Overspending Alerts</h3>
            <p className="text-sm text-fg-muted leading-relaxed">
              Establish category-specific spending caps. Stay informed with 3-tier visual alert
              badges before you exceed your planned budget.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="feature-card">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-fg">Visual Cash Flow Analytics</h3>
            <p className="text-sm text-fg-muted leading-relaxed">
              Gain instant perspective through interactive Recharts cash flow bars, net savings rate
              indicators, and category distribution donut charts.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="feature-card">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-fg">Atomic Balance Transfers</h3>
            <p className="text-sm text-fg-muted leading-relaxed">
              Transfer funds between wallets with guaranteed atomic balance reconciliation, exact
              2-decimal currency rounding, and automatic balance rollback on edits.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="feature-card">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-fg">Client-Side CSV & PDF Reports</h3>
            <p className="text-sm text-fg-muted leading-relaxed">
              Export bank-grade financial statements in CSV and PDF directly in your browser. Fast,
              privacy-friendly, and memory-safe.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="landing-section border-t border-border-subtle bg-surface/40"
      >
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="brand" className="mb-3">
            Workflow
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Simplicity by Design
          </h2>
          <p className="mt-4 text-fg-muted">
            Three simple steps to gain complete mastery over your personal cash flow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface border border-border-subtle space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
              1
            </div>
            <h3 className="font-semibold text-lg text-fg">Setup Your Wallets</h3>
            <p className="text-sm text-fg-muted">
              Add checking accounts, cash in hand, bKash, or credit cards in your native currencies.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface border border-border-subtle space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
              2
            </div>
            <h3 className="font-semibold text-lg text-fg">Record & Scan</h3>
            <p className="text-sm text-fg-muted">
              Log transactions manually or drag-and-drop receipt snapshots for instant AI scanning.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface border border-border-subtle space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
              3
            </div>
            <h3 className="font-semibold text-lg text-fg">Analyze & Export</h3>
            <p className="text-sm text-fg-muted">
              Monitor monthly budgets, watch your savings rate rise, and download PDF statements.
            </p>
          </div>
        </div>
      </section>

      {/* Security & Reliability Section */}
      <section id="security" className="landing-section border-t border-border-subtle">
        <div className="rounded-3xl border border-border-subtle bg-surface p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <Badge variant="brand">Bank-Grade Safeguards</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-fg">
              Your Financial Privacy & Data Integrity Come First
            </h2>
            <p className="text-sm sm:text-base text-fg-muted leading-relaxed">
              Every balance update is protected by atomic balance reconciliation. Your sessions use
              short-lived JWT access tokens and 6-digit email OTP codes. Client-side exports mean
              your private financial statements are compiled directly in your browser.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-medium text-fg">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Strict Tenant Isolation</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-600" />
                <span>Secure OTP Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Zod Input Validation</span>
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-brand-600" />
                <span>Client-Side PDF/CSV</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0 flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-muted border border-border-subtle text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-brand-600" />
            <div className="font-semibold text-fg">Security Verified</div>
            <div className="text-xs text-fg-muted max-w-[200px]">
              Multi-layer protection across Express REST API and Next.js frontend.
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
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

      {/* Public Footer */}
      <footer className="mt-auto border-t border-border-subtle bg-surface py-8 text-sm text-fg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-fg">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            <span>Antigravity Finance</span>
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
            &copy; {new Date().getFullYear()} Antigravity Finance. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
