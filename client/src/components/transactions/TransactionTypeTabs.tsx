// client/src/components/transactions/TransactionTypeTabs.tsx

// Accessible segmented tab control for switching between expense, income, and transfer transaction modes.

'use client';

import React from 'react';
import type { TransactionType } from '@/types';

interface TransactionTypeTabsProps {
  currentType: TransactionType;
  onChange: (type: TransactionType) => void;
}

export function TransactionTypeTabs({ currentType, onChange }: TransactionTypeTabsProps) {
  const tabs: { type: TransactionType; label: string }[] = [
    { type: 'expense', label: 'Expense' },
    { type: 'income', label: 'Income' },
    { type: 'transfer', label: 'Transfer' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-surface-muted">
      {tabs.map((tab) => {
        const isActive = currentType === tab.type;
        return (
          <button
            key={tab.type}
            type="button"
            onClick={() => onChange(tab.type)}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
              isActive ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
