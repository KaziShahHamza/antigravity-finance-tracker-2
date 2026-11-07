// client/src/components/budgets/BudgetMonthNavigator.tsx

// Monthly toolbar enabling calendar month navigation and displaying active warning/overspent alert counts.

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ChevronLeft, ChevronRight, AlertCircle, AlertTriangle } from 'lucide-react';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface BudgetMonthNavigatorProps {
  month: number;
  year: number;
  warningCount: number;
  exceededCount: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
}

export function BudgetMonthNavigator({
  month,
  year,
  warningCount,
  exceededCount,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
}: BudgetMonthNavigatorProps) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevMonth}
          className="h-9 w-9 p-0"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-36 text-center font-semibold text-fg">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextMonth}
          className="h-9 w-9 p-0"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCurrentMonth}
          className="text-xs text-fg-muted hover:text-fg"
        >
          Current Month
        </Button>
      </div>

      {/* Quick Alert Summary Pills */}
      <div className="flex items-center gap-2">
        {exceededCount > 0 && (
          <Badge variant="danger" className="gap-1 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{exceededCount} Overspent</span>
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="warning" className="gap-1 text-xs">
            <AlertTriangle className="h-3 w-3" />
            <span>{warningCount} Approaching Limit</span>
          </Badge>
        )}
      </div>
    </Card>
  );
}
