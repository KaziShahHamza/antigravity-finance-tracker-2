// client/tests/unit/AccountCard.test.tsx

// Unit tests for AccountCard component rendering, badge styling, and action callbacks.

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountCard } from '@/components/accounts/AccountCard';
import type { Account } from '@/types';

vi.mock('@/context/CurrencyContext', () => ({
  useCurrency: () => ({
    currency: 'USD',
    rates: { USD: 1.0, BDT: 110.0 },
    formatAmount: (amt: number, curr: string) => `$${amt.toFixed(2)}`,
  }),
}));

describe('AccountCard Component', () => {
  const mockAccount: Account = {
    id: 'acc-1',
    name: 'Personal Checking',
    type: 'bank',
    balance: 1500.5,
    currency: 'USD',
    color: '#3b82f6',
    icon: 'Landmark',
    isArchived: false,
  };

  it('renders account details, type badge, and formatted balance', () => {
    render(
      <AccountCard account={mockAccount} onEdit={vi.fn()} onDelete={vi.fn()} onTransfer={vi.fn()} />
    );

    expect(screen.getByText('Personal Checking')).toBeInTheDocument();
    expect(screen.getByText('Bank')).toBeInTheDocument();
    expect(screen.getByText(/1,500\.50/)).toBeInTheDocument();
  });

  it('triggers action buttons correctly', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    const handleTransfer = vi.fn();

    render(
      <AccountCard
        account={mockAccount}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTransfer={handleTransfer}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /transfer/i }));
    expect(handleTransfer).toHaveBeenCalledWith(mockAccount);

    fireEvent.click(screen.getByRole('button', { name: /edit account/i }));
    expect(handleEdit).toHaveBeenCalledWith(mockAccount);

    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    expect(handleDelete).toHaveBeenCalledWith(mockAccount);
  });
});
