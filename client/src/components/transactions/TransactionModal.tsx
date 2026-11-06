// client/src/components/transactions/TransactionModal.tsx

// Comprehensive modal for creating and editing Income, Expense, and Transfer transactions with OCR integration and inline category creation.

'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import type { Account, Category, Transaction, ReceiptOcrResult, TransactionType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ReceiptUploader } from './ReceiptUploader';
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
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [destinationAmount, setDestinationAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [vendor, setVendor] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptOcrData, setReceiptOcrData] = useState<Record<string, unknown> | null>(null);

  // Quick category creation state
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);

  const [showOcrScanner, setShowOcrScanner] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!transactionToEdit;

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setCurrency(transactionToEdit.currency);

      const accId =
        typeof transactionToEdit.accountId === 'object'
          ? transactionToEdit.accountId._id || transactionToEdit.accountId.id || ''
          : transactionToEdit.accountId;
      setAccountId(accId);

      const destAccId =
        typeof transactionToEdit.destinationAccountId === 'object'
          ? transactionToEdit.destinationAccountId._id ||
            transactionToEdit.destinationAccountId.id ||
            ''
          : transactionToEdit.destinationAccountId || '';
      setDestinationAccountId(destAccId);

      setDestinationAmount(
        transactionToEdit.destinationAmount ? String(transactionToEdit.destinationAmount) : ''
      );

      const catId =
        typeof transactionToEdit.categoryId === 'object'
          ? transactionToEdit.categoryId._id || transactionToEdit.categoryId.id || ''
          : transactionToEdit.categoryId || '';
      setCategoryId(catId);

      setDate(
        transactionToEdit.date
          ? transactionToEdit.date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setDescription(transactionToEdit.description || '');
      setVendor(transactionToEdit.vendor || '');
      setReceiptUrl(transactionToEdit.receiptUrl || '');
      setReceiptOcrData(transactionToEdit.receiptOcrData || null);
      setShowOcrScanner(false);
    } else {
      setType('expense');
      setAmount('');
      const defaultAcc = accounts[0];
      setAccountId(defaultAcc ? defaultAcc.id || defaultAcc._id || '' : '');
      setCurrency(defaultAcc ? defaultAcc.currency : 'USD');
      setDestinationAccountId(accounts[1] ? accounts[1].id || accounts[1]._id || '' : '');
      setDestinationAmount('');
      const defaultCat = categories.find((c) => c.type === 'expense');
      setCategoryId(defaultCat ? defaultCat.id || defaultCat._id || '' : '');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setVendor('');
      setReceiptUrl('');
      setReceiptOcrData(null);
      setShowOcrScanner(false);
    }
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setError(null);
  }, [transactionToEdit, accounts, categories, isOpen]);

  // Update transaction currency when account changes
  const handleAccountChange = (newAccId: string) => {
    setAccountId(newAccId);
    const selected = accounts.find((a) => (a.id || a._id) === newAccId);
    if (selected) {
      setCurrency(selected.currency);
    }
  };

  const handleOcrComplete = (ocrData: ReceiptOcrResult) => {
    if (ocrData.totalAmount) {
      setAmount(String(ocrData.totalAmount));
    }
    if (ocrData.currency) {
      setCurrency(ocrData.currency);
    }
    if (ocrData.vendor) {
      setVendor(ocrData.vendor);
      setDescription(`${ocrData.vendor} - Receipt`);
    }
    if (ocrData.date) {
      setDate(ocrData.date);
    }
    if (ocrData.receiptUrl) {
      setReceiptUrl(ocrData.receiptUrl);
    }
    setReceiptOcrData(ocrData as unknown as Record<string, unknown>);

    // Attempt to match suggestedCategory
    if (ocrData.suggestedCategory) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === ocrData.suggestedCategory.toLowerCase()
      );
      if (match) {
        setCategoryId(match.id || match._id || '');
      }
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsSavingCategory(true);
    try {
      const created = await api.post<Category>('/categories', {
        name: newCategoryName.trim(),
        type: type === 'income' ? 'income' : 'expense',
      });
      if (onCategoryCreated) {
        onCategoryCreated(created);
      }
      setCategoryId(created.id || created._id || '');
      setNewCategoryName('');
      setIsCreatingCategory(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setIsSavingCategory(false);
    }
  };

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

  const filteredCategories = categories.filter(
    (c) => c.type === (type === 'income' ? 'income' : 'expense')
  );

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
        {!isEdit && (
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-surface-muted">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                type === 'expense' ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted hover:text-fg'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                type === 'income' ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted hover:text-fg'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                type === 'transfer' ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted hover:text-fg'
              }`}
            >
              Transfer
            </button>
          </div>
        )}

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
          <>
            <Select
              label="Destination Wallet"
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              options={accounts
                .filter((a) => (a.id || a._id) !== accountId)
                .map((a) => ({
                  value: a.id || a._id || '',
                  label: `${a.name} (${a.currency} ${a.balance.toFixed(2)})`,
                }))}
              required
            />
            <Input
              label="Destination Amount (Optional Override)"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Auto-calculated if blank"
              value={destinationAmount}
              onChange={(e) => setDestinationAmount(e.target.value)}
            />
          </>
        )}

        {/* Category Selector with Inline Creator (Income/Expense) */}
        {type !== 'transfer' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-fg">Category</label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory((prev) => !prev)}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3" />
                {isCreatingCategory ? 'Cancel' : 'New Category'}
              </button>
            </div>

            {isCreatingCategory ? (
              <div className="flex items-center gap-2 p-2 rounded-lg border border-border-subtle bg-surface-muted/20">
                <Input
                  type="text"
                  placeholder="Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="grow"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCreateCategory}
                  disabled={isSavingCategory || !newCategoryName.trim()}
                >
                  {isSavingCategory ? 'Saving...' : 'Add'}
                </Button>
              </div>
            ) : (
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                options={[
                  { value: '', label: 'Select a category' },
                  ...filteredCategories.map((c) => ({
                    value: c.id || c._id || '',
                    label: c.name,
                  })),
                ]}
              />
            )}
          </div>
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
