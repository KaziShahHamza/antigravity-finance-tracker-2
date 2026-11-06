// client/src/app/(dashboard)/dashboard/page.tsx

// Primary dashboard view presenting user summary, quick links, and workspace overview.

'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeftRight, CheckCircle2, PieChart, PlusCircle, Settings, Wallet } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner Card */}
      <Card className="bg-gradient-to-br from-surface to-surface-muted border-border-subtle shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-fg">
                Welcome back, {user?.name || 'Explorer'}!
              </h2>
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            </div>
            <p className="mt-1 text-sm text-fg-muted">
              Here is your financial overview. Your default currency is set to{' '}
              <strong className="text-fg">{user?.defaultCurrency || 'USD'}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/transactions">
              <Button variant="primary" size="sm" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>New Transaction</span>
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Quick Navigation Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/accounts" className="focus-ring rounded-xl">
          <Card className="h-full transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-fg">Accounts</h3>
                <p className="text-xs text-fg-muted">Cash, Bank, bKash & Wallets</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/transactions" className="focus-ring rounded-xl">
          <Card className="h-full transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                <ArrowLeftRight className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-fg">Transactions</h3>
                <p className="text-xs text-fg-muted">History, Filters & AI OCR</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/budgets" className="focus-ring rounded-xl">
          <Card className="h-full transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <PieChart className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-fg">Budgets</h3>
                <p className="text-xs text-fg-muted">Limits & Spending Alerts</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/settings" className="focus-ring rounded-xl">
          <Card className="h-full transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted text-fg-muted">
                <Settings className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-fg">Settings</h3>
                <p className="text-xs text-fg-muted">Currency, Theme & Demo Data</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Placeholder for Analytics & Cash Flow Chart (Implemented in Phase 5) */}
      <Card className="py-12">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <div>
            <h3 className="text-lg font-semibold text-fg">Financial Activity & Cash Flow</h3>
            <p className="mt-1 text-sm text-fg-muted">
              Detailed analytics and charts will populate here as you record transactions.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-fg-muted">
            <PieChart className="h-12 w-12 text-fg-subtle" />
            <p className="text-sm">
              Ready to track income and expenses. Go to{' '}
              <Link href="/transactions" className="font-semibold text-brand-600 hover:underline">
                Transactions
              </Link>{' '}
              or load sample data in{' '}
              <Link href="/settings" className="font-semibold text-brand-600 hover:underline">
                Settings
              </Link>
              .
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
