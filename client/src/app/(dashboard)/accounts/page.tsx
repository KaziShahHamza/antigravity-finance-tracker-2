// client/src/app/(dashboard)/accounts/page.tsx

// Protected accounts overview page managing multi-currency wallets, total balances, and transfers.

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowRightLeft, Wallet, AlertCircle } from 'lucide-react';
import type { Account } from '@/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { AccountCard } from '@/components/accounts/AccountCard';
import { AccountModal } from '@/components/accounts/AccountModal';
import { TransferModal } from '@/components/accounts/TransferModal';
import { api } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { formatCurrency } from '@/lib/formatters';

interface AccountsApiResponse {
  accounts: (Account & { convertedBalance?: number })[];
  totalBalance: number;
  currency: string;
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'BDT', label: 'BDT (৳)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'SGD', label: 'SGD ($)' },
  { value: 'AED', label: 'AED (د.إ)' },
  { value: 'SAR', label: 'SAR (﷼)' },
];

export default function AccountsPage() {
  const { currency, setCurrency, convertToDisplay } = useCurrency();
  const [accounts, setAccounts] = useState<(Account & { convertedBalance?: number })[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceAccount, setTransferSourceAccount] = useState<Account | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<AccountsApiResponse>('/accounts');

      if (res?.accounts) {
        setAccounts(res.accounts);
        setTotalBalance(res.totalBalance || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreate = () => {
    setSelectedAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleTransfer = (account?: Account) => {
    setTransferSourceAccount(account || null);
    setIsTransferModalOpen(true);
  };

  const handleDelete = async (account: Account) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${account.name}"? If it has transactions, it will be archived.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/accounts/${account.id}`);
      await fetchAccounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  // Compute total balance converted to the current display currency
  const displayTotalBalance = convertToDisplay(totalBalance, 'USD');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header with Total Net Worth & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-border-subtle shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Total Net Balance
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
            {isLoading ? (
              <Skeleton className="h-10 w-48" />
            ) : (
              formatCurrency(displayTotalBalance, currency)
            )}
          </div>
          <p className="text-xs text-fg-subtle">
            Aggregated across all active bank, cash, and mobile wallets
          </p>
        </div>

        {/* Global Currency Selector & Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-32">
            <Select
              aria-label="Display Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={CURRENCY_OPTIONS}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => handleTransfer()}
            disabled={accounts.length < 2 || isLoading}
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Transfer
          </Button>

          <Button variant="primary" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Wallet
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchAccounts} className="ml-auto">
            Retry
          </Button>
        </div>
      )}

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center p-12 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface-muted text-fg-muted flex items-center justify-center mx-auto">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-fg">No wallets or accounts yet</h3>
            <p className="text-sm text-fg-muted max-w-sm mx-auto">
              Add your cash wallet, bank checking, bKash, or credit card to begin tracking balances.
            </p>
          </div>
          <Button variant="primary" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Wallet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTransfer={handleTransfer}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Wallet Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        account={selectedAccount}
        onSaved={fetchAccounts}
      />

      {/* Transfer Funds Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts}
        sourceAccount={transferSourceAccount}
        onSuccess={fetchAccounts}
      />
    </div>
  );
}
