// client/src/app/(dashboard)/transactions/page.tsx

// Protected transactions history and management page featuring filters, pagination, OCR auto-fill, and CRUD modals.

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Sparkles, AlertCircle } from 'lucide-react';
import type {
  Account,
  Category,
  Transaction,
  TransactionFilterParams,
  PaginationMeta,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { FiltersBar } from '@/components/transactions/FiltersBar';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { api } from '@/lib/api';

interface TransactionsApiResponse {
  data: Transaction[];
  pagination: PaginationMeta;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    totalCount: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasMore: false,
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<TransactionFilterParams>({
    page: 1,
    limit: 20,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Fetch accounts for wallet dropdowns
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get<{ accounts: Account[] }>('/accounts');
      if (res?.accounts) {
        setAccounts(res.accounts);
      }
    } catch (err) {
      console.warn('Failed to fetch accounts:', err);
    }
  }, []);

  // Fetch categories for category dropdowns
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get<Category[]>('/categories');
      if (Array.isArray(res)) {
        setCategories(res);
      }
    } catch (err) {
      console.warn('Failed to fetch categories:', err);
    }
  }, []);

  // Fetch filtered & paginated transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.type) params.append('type', filters.type);
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<TransactionsApiResponse>(`/transactions${queryStr}`);

      // Handle ApiResponse wrapping
      const txData = res as unknown as { data: Transaction[]; pagination: PaginationMeta };
      if (txData?.data && Array.isArray(txData.data)) {
        setTransactions(txData.data);
        if (txData.pagination) {
          setPagination(txData.pagination);
        }
      } else if (Array.isArray(res)) {
        setTransactions(res as unknown as Transaction[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, [fetchAccounts, fetchCategories]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (updated: TransactionFilterParams) => {
    setFilters(updated);
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleEdit = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
      fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
    }
  };

  const handleAddNew = () => {
    setSelectedTx(null);
    setIsModalOpen(true);
  };

  const handleCategoryCreated = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Transactions</h1>
          <p className="text-sm text-fg-muted mt-1">
            Track income, expenses, inter-wallet transfers, and AI-scanned receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleAddNew}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 dark:text-red-400 bg-red-500/10 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Toolbar */}
      <FiltersBar
        accounts={accounts}
        categories={categories}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Transaction Table History */}
      <TransactionTable
        transactions={transactions}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddNew={handleAddNew}
      />

      {/* Transaction Create / Edit Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accounts={accounts}
        categories={categories}
        transactionToEdit={selectedTx}
        onSuccess={() => {
          fetchTransactions();
          fetchAccounts();
        }}
        onCategoryCreated={handleCategoryCreated}
      />
    </div>
  );
}
