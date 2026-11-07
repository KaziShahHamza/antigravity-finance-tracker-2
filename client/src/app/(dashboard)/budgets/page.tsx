// client/src/app/(dashboard)/budgets/page.tsx

// Monthly budgets overview page with spending progress bars, overspending alert badges, and limit controls.

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetModal } from '@/components/budgets/BudgetModal';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { BudgetProgressItem, Category, MonthlyBudgetsData } from '@/types';
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  PieChart,
  PlusCircle,
} from 'lucide-react';

const MONTH_NAMES = [
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

export default function BudgetsPage() {
  const { user } = useAuth();
  const now = new Date();

  const [month, setMonth] = React.useState(now.getUTCMonth() + 1);
  const [year, setYear] = React.useState(now.getUTCFullYear());

  const [data, setData] = React.useState<MonthlyBudgetsData | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [budgetToEdit, setBudgetToEdit] = React.useState<BudgetProgressItem | null>(null);
  const [toastMessage, setToastMessage] = React.useState<{
    title: string;
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const defaultCurrency = user?.defaultCurrency || 'USD';

  const loadBudgetsAndCategories = React.useCallback(async () => {
    setLoading(true);
    try {
      const [budgetRes, catRes] = await Promise.all([
        api.get<MonthlyBudgetsData>(`/budgets?month=${month}&year=${year}`),
        api.get<Category[]>('/categories'),
      ]);

      if (budgetRes) {
        setData(budgetRes);
      }
      if (catRes) {
        setCategories(catRes);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load budgets';
      setToastMessage({ title: 'Error', message: msg, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  React.useEffect(() => {
    loadBudgetsAndCategories();
  }, [loadBudgetsAndCategories]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setMonth(now.getUTCMonth() + 1);
    setYear(now.getUTCFullYear());
  };

  const handleOpenCreate = () => {
    setBudgetToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (b: BudgetProgressItem) => {
    setBudgetToEdit(b);
    setModalOpen(true);
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget limit?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/budgets/${id}`);
      setToastMessage({
        title: 'Budget Deleted',
        message: 'The category budget limit has been removed.',
        variant: 'success',
      });
      loadBudgetsAndCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete budget';
      setToastMessage({ title: 'Error', message: msg, variant: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const warningCount = data?.budgets.filter((b) => b.alertTier === 'warning').length || 0;
  const exceededCount = data?.budgets.filter((b) => b.alertTier === 'exceeded').length || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Budgets & Alerts</h1>
          <p className="text-sm text-fg-muted">
            Track spending against monthly targets and monitor overspending alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" className="gap-2" onClick={handleOpenCreate}>
            <PlusCircle className="h-4 w-4" />
            <span>Set Budget</span>
          </Button>
        </div>
      </div>

      {/* Month Navigator Toolbar */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
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
            onClick={handleNextMonth}
            className="h-9 w-9 p-0"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCurrentMonth}
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

      {/* Overall Progress Banner */}
      {data && (
        <Card className="bg-gradient-to-br from-surface to-surface-muted">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-fg-muted">Total Budgeted</p>
              <p className="mt-1 text-2xl font-bold text-fg">
                {formatCurrency(data.totalBudgeted, defaultCurrency)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-fg-muted">Total Spent</p>
              <p className="mt-1 text-2xl font-bold text-fg">
                {formatCurrency(data.totalSpent, defaultCurrency)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-fg-muted">Overall Remaining</p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  data.remaining < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatCurrency(data.remaining, defaultCurrency)}
              </p>
            </div>
          </div>

          {/* Overall Percentage Bar */}
          <div className="mt-4 border-t border-border-subtle pt-4">
            <div className="flex justify-between text-xs text-fg-muted">
              <span>Overall Utilization</span>
              <span className="font-semibold text-fg">{data.overallPercentage}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  data.overallPercentage >= 100
                    ? 'bg-rose-500'
                    : data.overallPercentage >= 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(data.overallPercentage, 100)}%` }}
              />
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

      {/* Budgets Grid */}
      {!loading && data && data.budgets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.budgets.map((b) => (
            <BudgetCard
              key={b.id || b._id}
              budget={b}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteBudget}
              isDeleting={deletingId === (b.id || b._id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && data && data.budgets.length === 0 && (
        <Card className="py-12">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-fg-muted">
              <PieChart className="h-6 w-6 text-fg-subtle" />
            </span>
            <h3 className="font-semibold text-fg">
              No budgets set for {MONTH_NAMES[month - 1]} {year}
            </h3>
            <p className="text-xs text-fg-muted">
              Take control of your spending by defining monthly targets for your expense categories.
            </p>
            <Button variant="primary" size="sm" className="mt-2 gap-2" onClick={handleOpenCreate}>
              <PlusCircle className="h-4 w-4" />
              <span>Set Category Budget</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Modal for Create/Edit */}
      <BudgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setToastMessage({
            title: 'Budget Saved',
            message: budgetToEdit
              ? 'Budget limit updated successfully.'
              : 'New budget limit added.',
            variant: 'success',
          });
          loadBudgetsAndCategories();
        }}
        budgetToEdit={budgetToEdit}
        categories={categories}
        defaultCurrency={defaultCurrency}
        selectedMonth={month}
        selectedYear={year}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 shadow-lg">
          <Toast
            variant={toastMessage.variant}
            message={`${toastMessage.title}: ${toastMessage.message}`}
            onClick={() => setToastMessage(null)}
            className="cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
