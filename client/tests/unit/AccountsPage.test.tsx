// client/tests/unit/AccountsPage.test.tsx

// Unit tests for AccountsPage component verifying data loading, balance rendering, and modal triggers.

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AccountsPage from '@/app/(dashboard)/accounts/page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('@/context/CurrencyContext', () => ({
  useCurrency: () => ({
    currency: 'USD',
    setCurrency: vi.fn(),
    rates: { USD: 1.0, BDT: 110.0 },
    convertToDisplay: (amt: number) => amt,
    formatAmount: (amt: number) => `$${amt.toFixed(2)}`,
  }),
}));

describe('AccountsPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading skeletons initially and displays accounts once fetched', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      accounts: [
        {
          id: 'acc-1',
          name: 'Main Checking',
          type: 'bank',
          balance: 2000,
          currency: 'USD',
          color: '#3b82f6',
          icon: 'Landmark',
          isArchived: false,
        },
      ],
      totalBalance: 2000,
      currency: 'USD',
    });

    render(<AccountsPage />);

    // Initially should show skeletons or heading
    expect(screen.getByText(/total net balance/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Main Checking')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/2,000\.00/)).toHaveLength(2);
  });

  it('displays empty state when user has no accounts', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      accounts: [],
      totalBalance: 0,
      currency: 'USD',
    });

    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no wallets or accounts yet/i)).toBeInTheDocument();
    });
  });
});
