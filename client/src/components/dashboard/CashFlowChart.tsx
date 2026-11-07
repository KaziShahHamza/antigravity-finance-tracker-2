// client/src/components/dashboard/CashFlowChart.tsx

// Recharts grouped bar chart displaying monthly income vs expense cash flow trends.

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/formatters';
import { CashFlowPoint } from '@/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface CashFlowChartProps {
  data: CashFlowPoint[];
  currency: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency: string;
}

function CustomTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-3 shadow-md">
      <p className="mb-2 text-xs font-semibold text-fg">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-fg-muted">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}:
          </span>
          <span className="font-semibold text-fg">{formatCurrency(entry.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

export function CashFlowChart({ data, currency }: CashFlowChartProps) {
  return (
    <Card className="flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="font-semibold text-fg">Cash Flow Trend</h3>
        <p className="text-xs text-fg-muted">Income vs. Expenses across the past 6 months</p>
      </div>

      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-fg-muted"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              tickFormatter={(val: number) => `$${val}`}
              className="text-fg-muted"
            />
            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{ fill: 'currentColor', opacity: 0.05 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            />
            <Bar
              name="Income"
              dataKey="income"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              name="Expense"
              dataKey="expense"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
