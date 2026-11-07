// client/src/app/(dashboard)/budgets/page.tsx

// Monthly budgets overview page coordinating month navigation, progress cards, overspending alerts, and limit modals.

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetModal } from '@/components/budgets/BudgetModal';
import { BudgetMonthNavigator, MONTH_NAMES } from '@/components/budgets/BudgetMonthNavigator';
import { BudgetOverviewBanner } from '@/components/budgets/BudgetOverviewBanner';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { BudgetProgressItem, Category, MonthlyBudgetsData } from '@/types';
import { PieChart, PlusCircle } from 'lucide-react';

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
      <BudgetMonthNavigator
        month={month}
        year={year}
        warningCount={warningCount}
        exceededCount={exceededCount}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onCurrentMonth={handleCurrentMonth}
      />

      {/* Overall Progress Banner */}
      {data && (
        <BudgetOverviewBanner
          totalBudgeted={data.totalBudgeted}
          totalSpent={data.totalSpent}
          remaining={data.remaining}
          overallPercentage={data.overallPercentage}
          defaultCurrency={defaultCurrency}
        />
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
        <EmptyState
          icon={<PieChart className="h-6 w-6 text-fg-subtle" />}
          title={`No budgets set for ${MONTH_NAMES[month - 1]} ${year}`}
          description="Take control of your spending by defining monthly targets for your expense categories."
          action={
            <Button variant="primary" size="sm" className="gap-2" onClick={handleOpenCreate}>
              <PlusCircle className="h-4 w-4" />
              <span>Set Category Budget</span>
            </Button>
          }
        />
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
