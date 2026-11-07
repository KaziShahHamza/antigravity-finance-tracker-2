// client/tests/unit/BudgetCard.test.tsx

// Unit tests for BudgetCard component rendering, alert tier badges, and action handlers.

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import type { BudgetProgressItem } from '@/types';

describe('BudgetCard Component', () => {
  const baseBudget: BudgetProgressItem = {
    id: 'budget-1',
    categoryId: {
      _id: 'cat-1',
      name: 'Groceries',
      icon: 'ShoppingCart',
      color: '#10b981',
      type: 'expense',
    },
    month: 11,
    year: 2026,
    limitAmount: 500,
    currency: 'USD',
    spent: 250,
    remaining: 250,
    percentage: 50,
    alertTier: 'normal',
  };

  it('renders normal status when budget is on track (< 80%)', () => {
    render(<BudgetCard budget={baseBudget} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('On Track')).toBeInTheDocument();
    expect(screen.getByText('50% used')).toBeInTheDocument();
    expect(screen.getByText(/\$250\.00 left/)).toBeInTheDocument();
  });

  it('renders warning alert badge when budget is between 80% and 99%', () => {
    const warningBudget: BudgetProgressItem = {
      ...baseBudget,
      spent: 450,
      remaining: 50,
      percentage: 90,
      alertTier: 'warning',
    };

    render(<BudgetCard budget={warningBudget} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('80%+ Used')).toBeInTheDocument();
    expect(screen.getByText('90% used')).toBeInTheDocument();
    expect(screen.getByText(/\$50\.00 left/)).toBeInTheDocument();
  });

  it('renders danger alert badge when budget is exceeded (>= 100%)', () => {
    const exceededBudget: BudgetProgressItem = {
      ...baseBudget,
      spent: 600,
      remaining: -100,
      percentage: 120,
      alertTier: 'exceeded',
    };

    render(<BudgetCard budget={exceededBudget} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Overspent')).toBeInTheDocument();
    expect(screen.getByText('120% used')).toBeInTheDocument();
    expect(screen.getByText(/\$100\.00 over/)).toBeInTheDocument();
  });

  it('calls onEdit and onDelete handlers when buttons are clicked', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(<BudgetCard budget={baseBudget} onEdit={handleEdit} onDelete={handleDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(handleEdit).toHaveBeenCalledWith(baseBudget);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(handleDelete).toHaveBeenCalledWith('budget-1');
  });
});
