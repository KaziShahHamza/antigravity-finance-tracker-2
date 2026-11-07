// client/src/components/budgets/BudgetOverviewBanner.tsx

// Aggregate budget overview banner displaying total budgeted vs spent and visual utilization percentage.

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/formatters';

export interface BudgetOverviewBannerProps {
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  overallPercentage: number;
  defaultCurrency: string;
}

export function BudgetOverviewBanner({
  totalBudgeted,
  totalSpent,
  remaining,
  overallPercentage,
  defaultCurrency,
}: BudgetOverviewBannerProps) {
  return (
    <Card className="bg-gradient-to-br from-surface to-surface-muted">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-fg-muted">Total Budgeted</p>
          <p className="mt-1 text-2xl font-bold text-fg">
            {formatCurrency(totalBudgeted, defaultCurrency)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-fg-muted">Total Spent</p>
          <p className="mt-1 text-2xl font-bold text-fg">
            {formatCurrency(totalSpent, defaultCurrency)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-fg-muted">Overall Remaining</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              remaining < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatCurrency(remaining, defaultCurrency)}
          </p>
        </div>
      </div>

      {/* Overall Percentage Bar */}
      <div className="mt-4 border-t border-border-subtle pt-4">
        <div className="flex justify-between text-xs text-fg-muted">
          <span>Overall Utilization</span>
          <span className="font-semibold text-fg">{overallPercentage}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              overallPercentage >= 100
                ? 'bg-rose-500'
                : overallPercentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
