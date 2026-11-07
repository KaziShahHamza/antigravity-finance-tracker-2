// client/tests/unit/BudgetComponents.test.tsx

// Unit tests for extracted BudgetMonthNavigator and BudgetOverviewBanner components.

import { BudgetMonthNavigator } from '@/components/budgets/BudgetMonthNavigator';
import { BudgetOverviewBanner } from '@/components/budgets/BudgetOverviewBanner';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

describe('BudgetMonthNavigator Component', () => {
  it('renders current month, year, alert badges, and calls navigation callbacks', () => {
    const handlePrev = vi.fn();
    const handleNext = vi.fn();
    const handleCurrent = vi.fn();

    render(
      <BudgetMonthNavigator
        month={11}
        year={2026}
        warningCount={2}
        exceededCount={1}
        onPrevMonth={handlePrev}
        onNextMonth={handleNext}
        onCurrentMonth={handleCurrent}
      />
    );

    expect(screen.getByText('November 2026')).toBeDefined();
    expect(screen.getByText(/1 Overspent/i)).toBeDefined();
    expect(screen.getByText(/2 Approaching Limit/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(handlePrev).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(handleNext).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /current month/i }));
    expect(handleCurrent).toHaveBeenCalledTimes(1);
  });
});

describe('BudgetOverviewBanner Component', () => {
  it('renders total budgeted, total spent, remaining, and percentage bar', () => {
    render(
      <BudgetOverviewBanner
        totalBudgeted={5000}
        totalSpent={3250}
        remaining={1750}
        overallPercentage={65}
        defaultCurrency="USD"
      />
    );

    expect(screen.getByText('Total Budgeted')).toBeDefined();
    expect(screen.getByText('$5,000.00')).toBeDefined();
    expect(screen.getByText('Total Spent')).toBeDefined();
    expect(screen.getByText('$3,250.00')).toBeDefined();
    expect(screen.getByText('Overall Remaining')).toBeDefined();
    expect(screen.getByText('$1,750.00')).toBeDefined();
    expect(screen.getByText('65%')).toBeDefined();
  });
});
