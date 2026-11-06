// client/src/components/accounts/AccountModal.tsx

// Modal dialog for creating and editing financial accounts and multi-currency wallets.

'use client';

import React, { useState, useEffect } from 'react';
import type { Account, WalletType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account | null;
  onSaved: () => void;
}

const WALLET_TYPES: { value: WalletType; label: string }[] = [
  { value: 'cash', label: 'Cash Wallet' },
  { value: 'bank', label: 'Bank Account' },
  { value: 'bkash', label: 'bKash Mobile Wallet' },
  { value: 'nagad', label: 'Nagad Mobile Wallet' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'other', label: 'Other Account' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'BDT', label: 'BDT — Bangladeshi Taka' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SAR', label: 'SAR — Saudi Riyal' },
];

const COLOR_PRESETS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#e11d48', // Rose (bKash)
  '#ea580c', // Orange (Nagad)
  '#64748b', // Slate
];

export function AccountModal({ isOpen, onClose, account, onSaved }: AccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('cash');
  const [currency, setCurrency] = useState('USD');
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState('#10b981');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setCurrency(account.currency);
      setBalance(account.balance.toString());
      setColor(account.color || '#10b981');
    } else {
      setName('');
      setType('cash');
      setCurrency('USD');
      setBalance('0');
      setColor('#10b981');
    }
    setError(null);
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an account name');
      return;
    }

    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) {
      setError('Please provide a valid balance number');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        name: name.trim(),
        type,
        currency,
        balance: numBalance,
        color,
      };

      if (account) {
        await api.patch(`/accounts/${account.id}`, payload);
      } else {
        await api.post('/accounts', payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? 'Edit Wallet / Account' : 'Add New Wallet / Account'}
      description="Manage your multi-currency bank accounts, cash, and mobile wallets."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
            {error}
          </div>
        )}

        <Input
          label="Account Name"
          placeholder="e.g. Main Checking, Cash in Wallet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Wallet Type"
            value={type}
            onChange={(e) => setType(e.target.value as WalletType)}
            options={WALLET_TYPES}
          />

          <Select
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={CURRENCIES}
          />
        </div>

        <Input
          label={account ? 'Current Balance' : 'Initial Balance'}
          type="number"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          required
        />

        {/* Color Presets */}
        <div>
          <label className="field-label mb-1.5 block">Theme Accent</label>
          <div className="flex items-center gap-2.5">
            {COLOR_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                  color === preset ? 'scale-110 border-fg' : 'border-transparent'
                }`}
                style={{ backgroundColor: preset }}
                onClick={() => setColor(preset)}
                aria-label={`Select color ${preset}`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : account ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
