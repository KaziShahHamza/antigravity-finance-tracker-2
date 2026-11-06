// client/src/components/accounts/AccountCard.tsx

// Visual card displaying wallet balances, type badge, live currency conversion, and quick actions.

'use client';

import React from 'react';
import {
  Wallet,
  Landmark,
  Smartphone,
  CreditCard,
  Coins,
  ArrowRightLeft,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Account, WalletType } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/formatters';
import { useCurrency } from '@/context/CurrencyContext';

interface AccountCardProps {
  account: Account & { convertedBalance?: number };
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onTransfer: (account: Account) => void;
}

const typeConfig: Record<
  WalletType,
  {
    label: string;
    icon: React.ElementType;
    badgeVariant: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
  }
> = {
  cash: { label: 'Cash', icon: Wallet, badgeVariant: 'success' },
  bank: { label: 'Bank', icon: Landmark, badgeVariant: 'brand' },
  bkash: { label: 'bKash', icon: Smartphone, badgeVariant: 'danger' },
  nagad: { label: 'Nagad', icon: Smartphone, badgeVariant: 'warning' },
  credit: { label: 'Credit Card', icon: CreditCard, badgeVariant: 'brand' },
  other: { label: 'Other', icon: Coins, badgeVariant: 'neutral' },
};

export function AccountCard({ account, onEdit, onDelete, onTransfer }: AccountCardProps) {
  const { currency: displayCurrency, formatAmount } = useCurrency();
  const config = typeConfig[account.type] || typeConfig.other;
  const IconComponent = config.icon;

  const isDifferentCurrency = account.currency.toUpperCase() !== displayCurrency.toUpperCase();

  return (
    <Card className="flex flex-col justify-between p-5 relative overflow-hidden transition-all hover:shadow-md">
      {/* Accent color bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: account.color || '#10b981' }}
      />

      <div className="space-y-4">
        {/* Header: Icon, Name & Type Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: account.color || '#10b981' }}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-fg tracking-tight leading-tight">{account.name}</h3>
              <p className="text-xs text-fg-muted uppercase tracking-wider">{account.currency}</p>
            </div>
          </div>
          <Badge variant={config.badgeVariant}>{config.label}</Badge>
        </div>

        {/* Balance Display */}
        <div className="pt-2">
          <div className="text-xs text-fg-muted font-medium mb-1">Current Balance</div>
          <div className="text-2xl font-bold text-fg tracking-tight">
            {formatCurrency(account.balance, account.currency)}
          </div>
          {isDifferentCurrency && (
            <div className="text-xs text-fg-subtle mt-0.5">
              ≈ {formatAmount(account.balance, account.currency)} in {displayCurrency}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-5 border-t border-border-subtle mt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onTransfer(account)}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
          Transfer
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Edit account"
            className="p-2 text-fg-muted hover:text-fg"
            onClick={() => onEdit(account)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete account"
            className="p-2 text-fg-muted hover:text-red-500"
            onClick={() => onDelete(account)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
