// client/src/components/budgets/BudgetCard.tsx

// Visual card component displaying monthly category budget progress, spending percentage, and alert tiers.

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/formatters';
import { BudgetProgressItem } from '@/types';
import { AlertCircle, AlertTriangle, CheckCircle2, Edit2, Trash2 } from 'lucide-react';

interface BudgetCardProps {
  budget: BudgetProgressItem;
  onEdit: (budget: BudgetProgressItem) => void;
  onDelete: (budgetId: string) => void;
  isDeleting?: boolean;
}

export function BudgetCard({ budget, onEdit, onDelete, isDeleting = false }: BudgetCardProps) {
  const { categoryId, limitAmount, spent, remaining, percentage, alertTier, currency } = budget;

  // Determine alert badge styling & message
  const alertConfig = {
    normal: {
      variant: 'success' as const,
      icon: CheckCircle2,
      label: 'On Track',
      barColor: 'bg-emerald-500',
    },
    warning: {
      variant: 'warning' as const,
      icon: AlertTriangle,
      label: '80%+ Used',
      barColor: 'bg-amber-500',
    },
    exceeded: {
      variant: 'danger' as const,
      icon: AlertCircle,
      label: 'Overspent',
      barColor: 'bg-rose-500',
    },
  }[alertTier];

  const IconComponent = alertConfig.icon;
  const progressWidth = Math.min(Math.max(percentage, 0), 100);

  return (
    <Card className="flex flex-col justify-between transition-shadow hover:shadow-md">
      <div>
        {/* Header: Category info & Alert badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold shadow-sm"
              style={{ backgroundColor: categoryId.color || '#6366f1' }}
            >
              {categoryId.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <h3 className="font-semibold text-fg">{categoryId.name}</h3>
              <p className="text-xs text-fg-muted">Monthly limit</p>
            </div>
          </div>

          <Badge variant={alertConfig.variant} className="gap-1 text-xs">
            <IconComponent className="h-3 w-3" />
            <span>{alertConfig.label}</span>
          </Badge>
        </div>

        {/* Numbers: Spent vs Limit */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-fg-muted">Spent: </span>
            <span className="text-lg font-bold text-fg">{formatCurrency(spent, currency)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-fg-muted">Limit: </span>
            <span className="text-sm font-semibold text-fg">
              {formatCurrency(limitAmount, currency)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full transition-all duration-300 rounded-full ${alertConfig.barColor}`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-fg-muted">
            <span>{percentage}% used</span>
            <span className={remaining < 0 ? 'font-medium text-rose-500' : ''}>
              {remaining >= 0
                ? `${formatCurrency(remaining, currency)} left`
                : `${formatCurrency(Math.abs(remaining), currency)} over`}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Action buttons */}
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-border-subtle pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-fg-muted hover:text-fg"
          onClick={() => onEdit(budget)}
        >
          <Edit2 className="h-3.5 w-3.5" />
          <span>Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
          disabled={isDeleting}
          onClick={() => onDelete(budget.id || budget._id || '')}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </Button>
      </div>
    </Card>
  );
}
