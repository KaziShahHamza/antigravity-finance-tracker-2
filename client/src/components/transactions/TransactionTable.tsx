// client/src/components/transactions/TransactionTable.tsx

// Accessible table component displaying transaction history with type badges, actions, and pagination.

'use client';

import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Edit2,
  Trash2,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Transaction, PaginationMeta, PopulatedAccount, PopulatedCategory } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/formatters';

interface TransactionTableProps {
  transactions: Transaction[];
  pagination: PaginationMeta;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export function TransactionTable({
  transactions,
  pagination,
  isLoading,
  onPageChange,
  onEdit,
  onDelete,
  onAddNew,
}: TransactionTableProps) {
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const confirmDelete = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    try {
      const id = txToDelete._id || txToDelete.id || '';
      await onDelete(id);
      setTxToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'income':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Income</span>
          </Badge>
        );
      case 'transfer':
        return (
          <Badge variant="brand" className="flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3 text-brand-600 dark:text-brand-400" />
            <span>Transfer</span>
          </Badge>
        );
      case 'expense':
      default:
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Expense</span>
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-6 rounded-xl border border-border-subtle bg-surface animate-pulse">
        <div className="h-6 w-48 bg-surface-muted rounded" />
        <div className="space-y-3 mt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-surface-muted/60 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border-subtle bg-surface-muted/20">
        <Receipt className="w-12 h-12 text-fg-muted mb-3" />
        <h3 className="text-base font-semibold text-fg">No transactions found</h3>
        <p className="text-xs text-fg-muted max-w-sm mt-1 mb-4">
          No records match your selected filters. Adjust your search criteria or record a new
          transaction.
        </p>
        <Button variant="primary" size="sm" onClick={onAddNew}>
          + Record Transaction
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-border-subtle bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-muted/40 text-xs font-semibold text-fg-muted uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Wallet</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {transactions.map((tx) => {
              const account =
                typeof tx.accountId === 'object' ? (tx.accountId as PopulatedAccount) : null;
              const destAccount =
                typeof tx.destinationAccountId === 'object'
                  ? (tx.destinationAccountId as PopulatedAccount)
                  : null;
              const category =
                typeof tx.categoryId === 'object' ? (tx.categoryId as PopulatedCategory) : null;

              const isExpense = tx.type === 'expense';
              const isIncome = tx.type === 'income';

              const txDate = tx.date
                ? new Date(tx.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—';

              return (
                <tr key={tx._id || tx.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3 px-4 text-xs text-fg-muted whitespace-nowrap">{txDate}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{getTypeBadge(tx.type)}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-fg truncate max-w-[220px]">
                        {tx.description}
                      </span>
                      {tx.vendor && (
                        <span className="text-xs text-fg-muted truncate">{tx.vendor}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-fg">
                    {category ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-muted text-fg">
                        {category.name}
                      </span>
                    ) : (
                      <span className="text-fg-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-fg-muted">
                    {tx.type === 'transfer' ? (
                      <span>
                        {account?.name || 'Wallet'} → {destAccount?.name || 'Wallet'}
                      </span>
                    ) : (
                      <span>{account?.name || 'Wallet'}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-fg'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(tx)}
                        className="btn-icon text-fg-muted hover:text-brand-500"
                        title="Edit transaction"
                        aria-label="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxToDelete(tx)}
                        className="btn-icon text-fg-muted hover:text-rose-500"
                        title="Delete transaction"
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between p-4 border-t border-border-subtle text-xs text-fg-muted">
        <span>
          Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasMore}
            className="flex items-center gap-1"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? The account balance will be automatically reversed."
      >
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <Button
            type="button"
            variant="outline"
            onClick={() => setTxToDelete(null)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={confirmDelete}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isDeleting ? 'Deleting...' : 'Delete Transaction'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
