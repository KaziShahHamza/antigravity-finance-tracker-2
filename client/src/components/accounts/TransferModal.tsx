// client/src/components/accounts/TransferModal.tsx

// Modal dialog for executing atomic cross-wallet and cross-currency fund transfers.

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Account } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { convertAmount, formatCurrency, roundToTwoDecimals } from '@/lib/formatters';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  sourceAccount?: Account | null;
  onSuccess: () => void;
}

export function TransferModal({
  isOpen,
  onClose,
  accounts,
  sourceAccount,
  onSuccess,
}: TransferModalProps) {
  const { rates } = useCurrency();
  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [customDestinationAmount, setCustomDestinationAmount] = useState<string>('');
  const [useCustomRate, setUseCustomRate] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active source & destination account objects
  const activeFrom = useMemo(() => accounts.find((a) => a.id === fromId), [accounts, fromId]);
  const activeTo = useMemo(() => accounts.find((a) => a.id === toId), [accounts, toId]);

  useEffect(() => {
    if (sourceAccount) {
      setFromId(sourceAccount.id);
      const other = accounts.find((a) => a.id !== sourceAccount.id);
      setToId(other ? other.id : '');
    } else if (accounts.length >= 2) {
      setFromId(accounts[0].id);
      setToId(accounts[1].id);
    }
    setAmount('');
    setCustomDestinationAmount('');
    setUseCustomRate(false);
    setDescription('');
    setError(null);
  }, [sourceAccount, accounts, isOpen]);

  // Destination amount calculation preview
  const estimatedDestinationAmount = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (!activeFrom || !activeTo || isNaN(numAmount) || numAmount <= 0) {
      return 0;
    }
    return convertAmount(numAmount, activeFrom.currency, activeTo.currency, rates);
  }, [amount, activeFrom, activeTo, rates]);

  // Unit rate preview
  const unitRate = useMemo(() => {
    if (!activeFrom || !activeTo) return 1;
    return convertAmount(1, activeFrom.currency, activeTo.currency, rates);
  }, [activeFrom, activeTo, rates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId) {
      setError('Please select both source and destination accounts');
      return;
    }

    if (fromId === toId) {
      setError('Source and destination accounts must be different');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid transfer amount greater than 0');
      return;
    }

    if (activeFrom && activeFrom.type !== 'credit' && activeFrom.balance < numAmount) {
      setError(
        `Insufficient funds in ${activeFrom.name}. Available: ${formatCurrency(
          activeFrom.balance,
          activeFrom.currency
        )}`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: Record<string, unknown> = {
        fromAccountId: fromId,
        toAccountId: toId,
        amount: roundToTwoDecimals(numAmount),
        description: description.trim() || undefined,
      };

      if (useCustomRate && customDestinationAmount) {
        const destAmount = parseFloat(customDestinationAmount);
        if (!isNaN(destAmount) && destAmount > 0) {
          payload.destinationAmount = roundToTwoDecimals(destAmount);
        }
      }

      await api.post('/accounts/transfer', payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fromOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.name} (${formatCurrency(a.balance, a.currency)})`,
  }));

  const toOptions = accounts
    .filter((a) => a.id !== fromId)
    .map((a) => ({
      value: a.id,
      label: `${a.name} (${formatCurrency(a.balance, a.currency)})`,
    }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Funds"
      description="Transfer funds between your accounts with live currency conversion."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
            {error}
          </div>
        )}

        {/* Source & Destination selectors */}
        <div className="space-y-3">
          <Select
            label="From Account (Source)"
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            options={fromOptions}
          />

          <Select
            label="To Account (Destination)"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            options={toOptions}
          />
        </div>

        {/* Amount Input */}
        <Input
          label={`Transfer Amount (${activeFrom?.currency || 'USD'})`}
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        {/* Live Conversion Rate Box */}
        {activeFrom && activeTo && (
          <div className="p-3 rounded-lg bg-surface-muted border border-border-subtle text-xs space-y-1">
            <div className="flex justify-between text-fg-muted font-medium">
              <span>Exchange Rate:</span>
              <span>
                1 {activeFrom.currency} ≈ {unitRate} {activeTo.currency}
              </span>
            </div>
            <div className="flex justify-between text-fg font-semibold pt-1 border-t border-border-subtle/50">
              <span>Destination Receives:</span>
              <span>
                {formatCurrency(
                  useCustomRate && customDestinationAmount
                    ? parseFloat(customDestinationAmount) || 0
                    : estimatedDestinationAmount,
                  activeTo.currency
                )}
              </span>
            </div>
          </div>
        )}

        {/* Manual Rate Override Toggle */}
        {activeFrom?.currency !== activeTo?.currency && (
          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomRate}
                onChange={(e) => setUseCustomRate(e.target.checked)}
                className="rounded border-border-strong text-brand focus:ring-brand"
              />
              <span>Override received destination amount manually</span>
            </label>

            {useCustomRate && (
              <div className="mt-2">
                <Input
                  label={`Exact Destination Amount (${activeTo?.currency})`}
                  type="number"
                  step="0.01"
                  value={customDestinationAmount}
                  onChange={(e) => setCustomDestinationAmount(e.target.value)}
                  placeholder={estimatedDestinationAmount.toFixed(2)}
                />
              </div>
            )}
          </div>
        )}

        {/* Description Input */}
        <Input
          label="Note / Description (Optional)"
          placeholder="e.g. Monthly rent transfer, ATM cash withdrawal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Transferring...' : 'Execute Transfer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
