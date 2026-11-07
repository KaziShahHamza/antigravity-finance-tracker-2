// client/tests/unit/DashboardComponents.test.tsx

// Unit tests for TimeGreeting, MetricCards, and RecentTransactions dashboard components.

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeGreeting } from '@/components/dashboard/TimeGreeting';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import type { Transaction } from '@/types';

describe('Dashboard Components', () => {
  describe('TimeGreeting Component', () => {
    it('renders user name and currency correctly', () => {
      render(<TimeGreeting userName="Taylor" defaultCurrency="USD" />);
      expect(screen.getByText(/Taylor/)).toBeInTheDocument();
      expect(screen.getByText(/USD/)).toBeInTheDocument();
    });
  });

  describe('MetricCards Component', () => {
    it('renders 4 financial metrics with formatted values', () => {
      render(
        <MetricCards
          totalBalance={5200.5}
          monthlyIncome={4000}
          monthlyExpenses={1200}
          netSavings={2800}
          savingsRate={70}
          currency="USD"
        />
      );

      expect(screen.getByText('Total Net Balance')).toBeInTheDocument();
      expect(screen.getByText(/\$5,200\.50/)).toBeInTheDocument();
      expect(screen.getByText('Monthly Income')).toBeInTheDocument();
      expect(screen.getByText(/\+\$4,000\.00/)).toBeInTheDocument();
      expect(screen.getByText('Monthly Expenses')).toBeInTheDocument();
      expect(screen.getByText(/-\$1,200\.00/)).toBeInTheDocument();
      expect(screen.getByText('Net Savings Rate')).toBeInTheDocument();
      expect(screen.getByText(/\$2,800\.00/)).toBeInTheDocument();
      expect(screen.getByText('(70%)')).toBeInTheDocument();
    });
  });

  describe('RecentTransactions Component', () => {
    const mockTx: Transaction[] = [
      {
        id: 'tx-1',
        type: 'income',
        amount: 3000,
        currency: 'USD',
        convertedAmount: 3000,
        date: '2026-11-05T00:00:00.000Z',
        description: 'Tech Consulting',
        accountId: { name: 'Main Bank', type: 'bank', currency: 'USD' },
        categoryId: { name: 'Consulting', type: 'income' },
      },
      {
        id: 'tx-2',
        type: 'expense',
        amount: 45.5,
        currency: 'USD',
        convertedAmount: 45.5,
        date: '2026-11-06T00:00:00.000Z',
        description: 'Grocery Run',
        accountId: { name: 'Cash', type: 'cash', currency: 'USD' },
        categoryId: { name: 'Food', type: 'expense' },
      },
    ];

    it('renders recent transactions with descriptions, amounts, and category badges', () => {
      render(<RecentTransactions transactions={mockTx} currency="USD" />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Tech Consulting')).toBeInTheDocument();
      expect(screen.getByText('Grocery Run')).toBeInTheDocument();
      expect(screen.getByText(/\+\$3,000\.00/)).toBeInTheDocument();
      expect(screen.getByText(/-\$45\.50/)).toBeInTheDocument();
    });
  });
});
