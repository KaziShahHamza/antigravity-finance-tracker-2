// client/src/app/(dashboard)/dashboard/page.tsx

// Primary dashboard view presenting financial KPIs, cash flow analytics, breakdown charts, and recent activity.

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { TimeGreeting } from '@/components/dashboard/TimeGreeting';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { ExpenseBreakdownChart } from '@/components/dashboard/ExpenseBreakdownChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { exportTransactionsToPdf } from '@/lib/exportPdf';
import { DashboardSummary } from '@/types';
import { AlertCircle, AlertTriangle, FileText, PieChart, PlusCircle, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  const defaultCurrency = user?.defaultCurrency || 'USD';

  const loadSummary = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<DashboardSummary>('/dashboard/summary');
      if (data) {
        setSummary(data);
      }
    } catch {
      // Graceful fallback if error occurs
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const warningCount = summary?.budgetAlerts.warningCount || 0;
  const exceededCount = summary?.budgetAlerts.exceededCount || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Greeting with live AM/PM clock */}
      <Card className="bg-gradient-to-br from-surface to-surface-muted border-border-subtle shadow-sm">
        <TimeGreeting userName={user?.name} defaultCurrency={defaultCurrency} />

        {/* Quick Action Navigation Buttons */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
          <Link href="/transactions">
            <Button variant="primary" size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>New Transaction</span>
            </Button>
          </Link>
          <Link href="/accounts">
            <Button variant="outline" size="sm" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span>Accounts</span>
            </Button>
          </Link>
          <Link href="/budgets">
            <Button variant="outline" size="sm" className="gap-2">
              <PieChart className="h-4 w-4" />
              <span>Budgets</span>
            </Button>
          </Link>
          {summary && summary.recentTransactions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-fg-muted hover:text-fg"
              onClick={() =>
                exportTransactionsToPdf({
                  transactions: summary.recentTransactions,
                  user,
                  baseCurrency: summary.currency,
                })
              }
            >
              <FileText className="h-4 w-4" />
              <span>Export Statement</span>
            </Button>
          )}
        </div>
      </Card>

      {/* 2. Active Overspending Alerts Banner (if any) */}
      {(exceededCount > 0 || warningCount > 0) && (
        <Card className="border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-fg">Budget Spending Alerts</h4>
                <p className="text-xs text-fg-muted">
                  You have category budgets requiring your attention this month.
                </p>
              </div>
            </div>

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
                  <span>{warningCount} Near Limit</span>
                </Badge>
              )}
              <Link href="/budgets">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Review Budgets
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && summary && (
        <>
          {/* 3. Financial KPI Metric Cards */}
          <MetricCards
            totalBalance={summary.totalBalance}
            monthlyIncome={summary.monthlyIncome}
            monthlyExpenses={summary.monthlyExpenses}
            netSavings={summary.netSavings}
            savingsRate={summary.savingsRate}
            currency={summary.currency}
          />

          {/* 4. Interactive Charts Grid: Cash Flow Trend & Category Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CashFlowChart data={summary.cashFlowSeries} currency={summary.currency} />
            </div>
            <div>
              <ExpenseBreakdownChart data={summary.categoryBreakdown} currency={summary.currency} />
            </div>
          </div>

          {/* 5. Recent Activity Ledger */}
          <RecentTransactions
            transactions={summary.recentTransactions}
            currency={summary.currency}
          />
        </>
      )}
    </div>
  );
}
