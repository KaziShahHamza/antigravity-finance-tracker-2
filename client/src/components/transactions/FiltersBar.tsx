// client/src/components/transactions/FiltersBar.tsx

// Interactive filters toolbar supporting debounced search, wallet, category, type, date range, and sorting.

'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import type { Account, Category, TransactionFilterParams, TransactionType } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface FiltersBarProps {
  accounts: Account[];
  categories: Category[];
  filters: TransactionFilterParams;
  onFilterChange: (updated: TransactionFilterParams) => void;
  onReset: () => void;
}

export function FiltersBar({
  accounts,
  categories,
  filters,
  onFilterChange,
  onReset,
}: FiltersBarProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        onFilterChange({ ...filters, search: searchTerm, page: 1 });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, filters, onFilterChange]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as TransactionType | '';
    onFilterChange({ ...filters, type: val || undefined, page: 1 });
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, accountId: e.target.value || undefined, page: 1 });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, categoryId: e.target.value || undefined, page: 1 });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, startDate: e.target.value || undefined, page: 1 });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, endDate: e.target.value || undefined, page: 1 });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'date_desc') {
      onFilterChange({ ...filters, sortBy: 'date', sortOrder: 'desc', page: 1 });
    } else if (val === 'date_asc') {
      onFilterChange({ ...filters, sortBy: 'date', sortOrder: 'asc', page: 1 });
    } else if (val === 'amount_desc') {
      onFilterChange({ ...filters, sortBy: 'amount', sortOrder: 'desc', page: 1 });
    } else if (val === 'amount_asc') {
      onFilterChange({ ...filters, sortBy: 'amount', sortOrder: 'asc', page: 1 });
    }
  };

  const currentSortVal = `${filters.sortBy || 'date'}_${filters.sortOrder || 'desc'}`;

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.type ||
    filters.accountId ||
    filters.categoryId ||
    filters.startDate ||
    filters.endDate ||
    (filters.sortBy && filters.sortBy !== 'date') ||
    (filters.sortOrder && filters.sortOrder !== 'desc')
  );

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border-subtle bg-surface">
      {/* Search & Quick Controls Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search transactions by description or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="field-control pl-9"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={filters.type || ''}
            onChange={handleTypeChange}
            options={[
              { value: '', label: 'All Types' },
              { value: 'expense', label: 'Expenses' },
              { value: 'income', label: 'Income' },
              { value: 'transfer', label: 'Transfers' },
            ]}
          />

          <Select
            value={currentSortVal}
            onChange={handleSortChange}
            options={[
              { value: 'date_desc', label: 'Date (Newest)' },
              { value: 'date_asc', label: 'Date (Oldest)' },
              { value: 'amount_desc', label: 'Amount (High to Low)' },
              { value: 'amount_asc', label: 'Amount (Low to High)' },
            ]}
          />

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                onReset();
              }}
              className="flex items-center gap-1.5 text-fg-muted hover:text-fg"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Secondary Filter Controls Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border-subtle">
        <Select
          label="Wallet"
          value={filters.accountId || ''}
          onChange={handleAccountChange}
          options={[
            { value: '', label: 'All Wallets' },
            ...accounts.map((a) => ({
              value: a.id || a._id || '',
              label: a.name,
            })),
          ]}
        />

        <Select
          label="Category"
          value={filters.categoryId || ''}
          onChange={handleCategoryChange}
          options={[
            { value: '', label: 'All Categories' },
            ...categories.map((c) => ({
              value: c.id || c._id || '',
              label: c.name,
            })),
          ]}
        />

        <Input
          label="Start Date"
          type="date"
          value={filters.startDate || ''}
          onChange={handleStartDateChange}
        />

        <Input
          label="End Date"
          type="date"
          value={filters.endDate || ''}
          onChange={handleEndDateChange}
        />
      </div>
    </div>
  );
}
