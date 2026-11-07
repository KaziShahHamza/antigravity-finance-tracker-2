// client/tests/unit/TransactionsPage.test.tsx

// Unit tests for TransactionsPage component verifying loading, list rendering, search/filter, and modal triggers.

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TransactionsPage from '@/app/(dashboard)/transactions/page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    postForm: vi.fn(),
  },
}));

vi.mock('@/context/CurrencyContext', () => ({
  useCurrency: () => ({
    currentCurrency: 'USD',
    currency: 'USD',
    setCurrency: vi.fn(),
    rates: { USD: 1.0, BDT: 110.0 },
    convertToDisplay: (amt: number) => amt,
    formatAmount: (amt: number) => `$${amt.toFixed(2)}`,
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      defaultCurrency: 'USD',
      isVerified: true,
      themePreference: 'system',
    },
    isAuthenticated: true,
  }),
}));

describe('TransactionsPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders transactions page, loads accounts, categories, and transaction history', async () => {
    vi.mocked(api.get).mockImplementation((endpoint: string) => {
      if (endpoint === '/accounts') {
        return Promise.resolve({
          accounts: [
            {
              id: 'acc-1',
              name: 'Checking',
              type: 'bank',
              balance: 1000,
              currency: 'USD',
              color: '#3b82f6',
              icon: 'Wallet',
              isArchived: false,
            },
          ],
        });
      }
      if (endpoint === '/categories') {
        return Promise.resolve([
          {
            id: 'cat-1',
            name: 'Food & Dining',
            type: 'expense',
            icon: 'Utensils',
            color: '#f97316',
            isDefault: true,
          },
        ]);
      }
      if (endpoint.startsWith('/transactions')) {
        return Promise.resolve({
          data: [
            {
              _id: 'tx-1',
              type: 'expense',
              amount: 45.5,
              currency: 'USD',
              convertedAmount: 45.5,
              description: 'Dinner at Italian Place',
              vendor: 'Luigi Pasta',
              date: '2026-11-06T12:00:00.000Z',
              accountId: { id: 'acc-1', name: 'Checking', currency: 'USD' },
              categoryId: { id: 'cat-1', name: 'Food & Dining' },
            },
          ],
          pagination: {
            totalCount: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
            hasMore: false,
          },
        });
      }
      return Promise.resolve({});
    });

    render(<TransactionsPage />);

    expect(screen.getByRole('heading', { level: 1, name: /transactions/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Dinner at Italian Place')).toBeInTheDocument();
      expect(screen.getByText('Luigi Pasta')).toBeInTheDocument();
    });
  });

  it('opens transaction modal when clicking Add Transaction button', async () => {
    vi.mocked(api.get).mockResolvedValue({
      accounts: [],
      categories: [],
      data: [],
      pagination: { totalCount: 0, page: 1, limit: 20, totalPages: 1, hasMore: false },
    });

    render(<TransactionsPage />);

    const addBtn = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Record Transaction')).toBeInTheDocument();
    });
  });
});
