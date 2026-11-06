// client/src/components/transactions/TransferFields.tsx

// Destination account picker and optional converted amount input for fund transfers between wallets.

'use client';

import React from 'react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import type { Account } from '@/types';

interface TransferFieldsProps {
  accounts: Account[];
  sourceAccountId: string;
  destinationAccountId: string;
  destinationAmount: string;
  onDestinationAccountChange: (id: string) => void;
  onDestinationAmountChange: (amount: string) => void;
}

export function TransferFields({
  accounts,
  sourceAccountId,
  destinationAccountId,
  destinationAmount,
  onDestinationAccountChange,
  onDestinationAmountChange,
}: TransferFieldsProps) {
  const availableDestinations = accounts
    .filter((a) => (a.id || a._id) !== sourceAccountId)
    .map((a) => ({
      value: a.id || a._id || '',
      label: `${a.name} (${a.currency} ${a.balance.toFixed(2)})`,
    }));

  return (
    <>
      <Select
        label="Destination Wallet"
        value={destinationAccountId}
        onChange={(e) => onDestinationAccountChange(e.target.value)}
        options={availableDestinations}
        required
      />
      <Input
        label="Destination Amount (Optional Override)"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Auto-calculated if blank"
        value={destinationAmount}
        onChange={(e) => onDestinationAmountChange(e.target.value)}
      />
    </>
  );
}
