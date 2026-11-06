// client/src/components/transactions/TransactionModal.tsx

// Comprehensive modal for creating and editing Income, Expense, and Transfer transactions with OCR integration and inline category creation.

'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { Account, Category, Transaction } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ReceiptUploader } from './ReceiptUploader';
import { TransactionTypeTabs } from './TransactionTypeTabs';
import { TransferFields } from './TransferFields';
import { InlineCategoryCreator } from '@/components/categories/InlineCategoryCreator';
import { useTransactionForm } from './useTransactionForm';
import { api } from '@/lib/api';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  transactionToEdit?: Transaction | null;
  onSuccess: () => void;
  onCategoryCreated?: (category: Category) => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  accounts,
  categories,
  transactionToEdit,
  onSuccess,
  onCategoryCreated,
}: TransactionModalProps) {
  const {
    type,
    setType,
    amount,
    setAmount,
    currency,
    accountId,
    destinationAccountId,
    setDestinationAccountId,
    destinationAmount,
    setDestinationAmount,
    categoryId,
    setCategoryId,
    date,
    setDate,
    description,
    setDescription,
    vendor,
    setVendor,
    receiptUrl,
    receiptOcrData,
    handleAccountChange,
    handleOcrComplete,
  } = useTransactionForm({ isOpen, accounts, categories, transactionToEdit });

  const [showOcrScanner, setShowOcrScanner] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!transactionToEdit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (!accountId) {
      setError('Please select an account');
      return;
    }

    if (type === 'transfer') {
      if (!destinationAccountId || destinationAccountId === accountId) {
        setError('Please select a distinct destination account');
        return;
      }
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        accountId,
        type,
        amount: numAmount,
        currency,
        date,
        description: description.trim(),
        vendor: vendor.trim() || undefined,
        receiptUrl: receiptUrl || undefined,
        receiptOcrData: receiptOcrData || undefined,
      };

      if (type === 'transfer') {
        payload.destinationAccountId = destinationAccountId;
        if (destinationAmount && parseFloat(destinationAmount) > 0) {
          payload.destinationAmount = parseFloat(destinationAmount);
        }
      } else {
        payload.categoryId = categoryId || undefined;
      }

      if (isEdit) {
        const txId = transactionToEdit._id || transactionToEdit.id;
        await api.patch(`/transactions/${txId}`, payload);
      } else {
        await api.post('/transactions', payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Transaction' : 'Record Transaction'}
      description={
        isEdit
          ? 'Update transaction details and reconcile balances.'
          : 'Log an income, expense, or inter-wallet transfer.'
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type Selector Tabs */}
        {!isEdit && <TransactionTypeTabs currentType={type} onChange={setType} />}

        {/* AI Receipt Scanner toggle (only for Expense in create mode) */}
        {!isEdit && type === 'expense' && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowOcrScanner((prev) => !prev)}
              className="flex items-center justify-between p-3 rounded-xl border border-brand-500/30 bg-brand-500/5 hover:bg-brand-500/10 text-xs font-medium text-brand-600 dark:text-brand-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{showOcrScanner ? 'Hide Receipt Scanner' : 'Scan Receipt with AI OCR'}</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20">
                Gemini Vision
              </span>
            </button>
            {showOcrScanner && <ReceiptUploader onScanComplete={handleOcrComplete} />}
          </div>
        )}

        {/* Amount & Currency Fields */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <Input label="Currency" type="text" value={currency} disabled className="opacity-75" />
          </div>
        </div>

        {/* Account Selector */}
        <Select
          label={type === 'transfer' ? 'Source Wallet' : 'Account / Wallet'}
          value={accountId}
          onChange={(e) => handleAccountChange(e.target.value)}
          options={accounts.map((a) => ({
            value: a.id || a._id || '',
            label: `${a.name} (${a.currency} ${a.balance.toFixed(2)})`,
          }))}
          required
        />

        {/* Transfer Destination Account */}
        {type === 'transfer' && (
          <TransferFields
            accounts={accounts}
            sourceAccountId={accountId}
            destinationAccountId={destinationAccountId}
            destinationAmount={destinationAmount}
            onDestinationAccountChange={setDestinationAccountId}
            onDestinationAmountChange={setDestinationAmount}
          />
        )}

        {/* Category Selector with Inline Creator (Income/Expense) */}
        {type !== 'transfer' && (
          <InlineCategoryCreator
            categories={categories}
            selectedCategoryId={categoryId}
            transactionType={type}
            onSelectCategory={setCategoryId}
            onCategoryCreated={onCategoryCreated}
            onError={setError}
          />
        )}

        {/* Date & Vendor */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Vendor / Payee"
            type="text"
            placeholder="e.g. Starbucks, Walmart"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />
        </div>

        {/* Description */}
        <Input
          label="Description"
          type="text"
          placeholder="e.g. Grocery shopping, Client payment"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {error && (
          <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-500/10 rounded-lg">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="sticky bottom-0 -mx-1 bg-surface px-1 pt-3 pb-1 border-t border-border-subtle flex items-center justify-end gap-3 shrink-0 z-10">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Transaction' : 'Save Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
