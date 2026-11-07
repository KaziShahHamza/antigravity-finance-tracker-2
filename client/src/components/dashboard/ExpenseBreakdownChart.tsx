// client/src/components/dashboard/ExpenseBreakdownChart.tsx

// Recharts donut chart visualizing category expense distribution and percentage shares.

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/formatters';
import { CategoryBreakdownPoint } from '@/types';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

interface ExpenseBreakdownChartProps {
  data: CategoryBreakdownPoint[];
  currency: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CategoryBreakdownPoint }>;
  currency: string;
}

function CustomTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-2.5 shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-xs font-semibold text-fg">{item.name}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-4 text-xs">
        <span className="text-fg-muted">{formatCurrency(item.amount, currency)}</span>
        <span className="font-bold text-fg">{item.percentage}%</span>
      </div>
    </div>
  );
}

export function ExpenseBreakdownChart({ data, currency }: ExpenseBreakdownChartProps) {
  const hasData = data && data.length > 0 && data.some((d) => d.amount > 0);

  return (
    <Card className="flex flex-col justify-between">
      <div className="mb-2">
        <h3 className="font-semibold text-fg">Expense Breakdown</h3>
        <p className="text-xs text-fg-muted">Spending distribution for current month</p>
      </div>

      {hasData ? (
        <div className="flex flex-col items-center">
          <div className="h-48 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {data.map((entry) => (
                    <Cell key={entry.categoryId} fill={entry.color || '#6366f1'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top categories legend list */}
          <div className="mt-2 flex w-full flex-col gap-1.5 overflow-hidden">
            {data.slice(0, 4).map((entry) => (
              <div key={entry.categoryId} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate text-fg-muted">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-medium text-fg">
                    {formatCurrency(entry.amount, currency)}
                  </span>
                  <span className="w-8 text-right text-fg-muted">{entry.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-56 flex-col items-center justify-center text-center">
          <PieIcon className="h-8 w-8 text-fg-subtle" />
          <p className="mt-2 text-xs text-fg-muted">No expenses recorded for this month</p>
        </div>
      )}
    </Card>
  );
}
