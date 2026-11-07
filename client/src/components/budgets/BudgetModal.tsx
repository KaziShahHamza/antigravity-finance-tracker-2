// client/src/components/budgets/BudgetModal.tsx

// Dialog modal for creating or editing monthly category budget spending limits.

'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { BudgetProgressItem, Category } from '@/types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetToEdit?: BudgetProgressItem | null;
  categories: Category[];
  defaultCurrency: string;
  selectedMonth: number;
  selectedYear: number;
}

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

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'BDT', label: 'BDT (৳)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

export function BudgetModal({
  isOpen,
  onClose,
  onSuccess,
  budgetToEdit,
  categories,
  defaultCurrency,
  selectedMonth,
  selectedYear,
}: BudgetModalProps) {
  const [categoryId, setCategoryId] = React.useState('');
  const [limitAmount, setLimitAmount] = React.useState('');
  const [currency, setCurrency] = React.useState(defaultCurrency);
  const [month, setMonth] = React.useState(selectedMonth);
  const [year, setYear] = React.useState(selectedYear);
  const [loading, setLoading] = React.useState(false);
  const [errorToast, setErrorToast] = React.useState<string | null>(null);

  const isEditing = Boolean(budgetToEdit);

  // Filter only expense categories
  const expenseCategories = React.useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

  React.useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.categoryId._id || budgetToEdit.categoryId.id || '');
      setLimitAmount(budgetToEdit.limitAmount.toString());
      setCurrency(budgetToEdit.currency || defaultCurrency);
      setMonth(budgetToEdit.month);
      setYear(budgetToEdit.year);
    } else {
      setCategoryId(expenseCategories[0]?._id || expenseCategories[0]?.id || '');
      setLimitAmount('');
      setCurrency(defaultCurrency);
      setMonth(selectedMonth);
      setYear(selectedYear);
    }
  }, [budgetToEdit, expenseCategories, defaultCurrency, selectedMonth, selectedYear, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(limitAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorToast('Please enter a valid positive budget limit amount.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && budgetToEdit) {
        const id = budgetToEdit.id || budgetToEdit._id;
        await api.patch(`/budgets/${id}`, {
          limitAmount: amountNum,
          currency,
        });
      } else {
        if (!categoryId) {
          setErrorToast('Please select a category for this budget.');
          setLoading(false);
          return;
        }
        await api.post('/budgets', {
          categoryId,
          month: Number(month),
          year: Number(year),
          limitAmount: amountNum,
          currency,
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save budget limit';
      setErrorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Edit Category Budget' : 'Set Category Budget'}
        description={
          isEditing
            ? `Update spending threshold for ${budgetToEdit?.categoryId.name}.`
            : 'Define a monthly spending target to receive real-time alerts.'
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Category Selector */}
          <div>
            <label className="mb-1 block text-sm font-medium text-fg">Expense Category</label>
            {isEditing ? (
              <Input
                value={budgetToEdit?.categoryId.name || ''}
                disabled
                className="bg-surface-muted text-fg-muted"
              />
            ) : (
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                {expenseCategories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-fg">Limit Amount</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="500.00"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-fg">Currency</label>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Month & Year (editable only on create) */}
          {!isEditing && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-fg">Month</label>
                <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-fg">Year</label>
                <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="mt-4 flex justify-end gap-2 border-t border-border-subtle pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update Budget' : 'Set Budget'}
            </Button>
          </div>
        </form>
      </Modal>

      {errorToast && (
        <div className="mt-3">
          <Toast variant="error" message={errorToast} />
        </div>
      )}
    </>
  );
}
