// client/src/components/dashboard/MetricCards.tsx

// KPI metric cards presenting Total Balance, Monthly Income, Monthly Expense, and Net Savings Rate.

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/formatters';
import { PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

interface MetricCardsProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netSavings: number;
  savingsRate: number;
  currency: string;
}

export function MetricCards({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  netSavings,
  savingsRate,
  currency,
}: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Balance */}
      <Card className="flex flex-col justify-between transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-fg-muted">Total Net Balance</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
            <Wallet className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-fg">
            {formatCurrency(totalBalance, currency)}
          </p>
          <p className="mt-1 text-xs text-fg-muted">Across all active wallets</p>
        </div>
      </Card>

      {/* 2. Monthly Income */}
      <Card className="flex flex-col justify-between transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-fg-muted">Monthly Income</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(monthlyIncome, currency)}
          </p>
          <p className="mt-1 text-xs text-fg-muted">Current calendar month</p>
        </div>
      </Card>

      {/* 3. Monthly Expenses */}
      <Card className="flex flex-col justify-between transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-fg-muted">Monthly Expenses</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <TrendingDown className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            -{formatCurrency(monthlyExpenses, currency)}
          </p>
          <p className="mt-1 text-xs text-fg-muted">Current calendar month</p>
        </div>
      </Card>

      {/* 4. Net Savings Rate */}
      <Card className="flex flex-col justify-between transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-fg-muted">Net Savings Rate</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <PiggyBank className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <p
              className={`text-2xl font-bold tracking-tight ${
                netSavings >= 0 ? 'text-fg' : 'text-rose-500'
              }`}
            >
              {formatCurrency(netSavings, currency)}
            </p>
            <span
              className={`text-xs font-semibold ${
                savingsRate >= 20
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : savingsRate >= 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-500'
              }`}
            >
              ({savingsRate}%)
            </span>
          </div>
          <p className="mt-1 text-xs text-fg-muted">Income retention rate</p>
        </div>
      </Card>
    </div>
  );
}
