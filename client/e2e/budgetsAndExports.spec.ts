// client/e2e/budgetsAndExports.spec.ts

// Playwright E2E tests verifying budget alert badges, dashboard metrics/charts, and client-side exports.

import { expect, test } from '@playwright/test';

test.describe('Budgets, Dashboard Analytics & Financial Exports', () => {
  test.beforeEach(async ({ page }) => {
    // Set authenticated token and user cache in browser localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('aft_refresh_token', 'mock_refresh_token');
      window.localStorage.setItem(
        'aft_user',
        JSON.stringify({
          id: 'user_e2e',
          name: 'Jordan Finch',
          email: 'jordan@example.com',
          defaultCurrency: 'USD',
          isVerified: true,
          themePreference: 'system',
        })
      );
    });

    // Mock /api/auth/refresh
    await page.route('**/api/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          accessToken: 'mock_refreshed_access_token',
          refreshToken: 'mock_refresh_token',
        }),
      });
    });

    // Mock /api/users/me
    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'u-phase5',
            name: 'Jordan Finch',
            email: 'jordan@example.com',
            defaultCurrency: 'USD',
            isVerified: true,
            themePreference: 'system',
          },
        }),
      });
    });

    // Mock /api/rates
    await page.route('**/api/rates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            baseCurrency: 'USD',
            rates: { USD: 1.0, BDT: 110.0, EUR: 0.92 },
            isFallback: false,
          },
        }),
      });
    });

    // Mock /api/categories
    await page.route('**/api/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'cat-groceries',
              name: 'Groceries',
              type: 'expense',
              color: '#10b981',
              icon: 'ShoppingCart',
            },
            {
              id: 'cat-dining',
              name: 'Dining',
              type: 'expense',
              color: '#ef4444',
              icon: 'Utensils',
            },
          ],
        }),
      });
    });
  });

  test('navigates to /budgets, renders progress metrics and alert badges, and opens budget modal', async ({
    page,
  }) => {
    // Mock /api/budgets
    await page.route('**/api/budgets*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              budgets: [
                {
                  id: 'b-1',
                  categoryId: {
                    _id: 'cat-dining',
                    name: 'Dining',
                    color: '#ef4444',
                    icon: 'Utensils',
                    type: 'expense',
                  },
                  month: 11,
                  year: 2026,
                  limitAmount: 400,
                  currency: 'USD',
                  spent: 450,
                  remaining: -50,
                  percentage: 112,
                  alertTier: 'exceeded',
                },
              ],
              totalBudgeted: 400,
              totalSpent: 450,
              remaining: -50,
              overallPercentage: 112,
              month: 11,
              year: 2026,
            },
          }),
        });
      }
    });

    await page.goto('/budgets');
    await expect(page.getByRole('heading', { name: 'Budgets & Alerts' })).toBeVisible();

    // Verify overspent alert badge
    await expect(page.getByText('Overspent').first()).toBeVisible();
    await expect(page.getByText('Dining').first()).toBeVisible();
    await expect(page.getByText(/112% used/)).toBeVisible();

    // Open Set Budget Modal
    await page
      .getByRole('button', { name: /Set Budget/i })
      .first()
      .click();
    await expect(page.getByText('Set Category Budget')).toBeVisible();
  });

  test('navigates to /dashboard, displays AM/PM clock greeting, metric cards, charts, and recent activity', async ({
    page,
  }) => {
    // Mock /api/dashboard/summary
    await page.route('**/api/dashboard/summary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalBalance: 6500,
            monthlyIncome: 5000,
            monthlyExpenses: 2000,
            netSavings: 3000,
            savingsRate: 60,
            currency: 'USD',
            cashFlowSeries: [
              { month: 'Jun', year: 2026, income: 4000, expense: 2500, net: 1500 },
              { month: 'Jul', year: 2026, income: 4200, expense: 2400, net: 1800 },
              { month: 'Aug', year: 2026, income: 4500, expense: 2200, net: 2300 },
              { month: 'Sep', year: 2026, income: 4800, expense: 2600, net: 2200 },
              { month: 'Oct', year: 2026, income: 5200, expense: 2800, net: 2400 },
              { month: 'Nov', year: 2026, income: 5000, expense: 2000, net: 3000 },
            ],
            categoryBreakdown: [
              {
                categoryId: 'cat-groceries',
                name: 'Groceries',
                color: '#10b981',
                icon: 'ShoppingCart',
                amount: 1200,
                percentage: 60,
              },
            ],
            recentTransactions: [
              {
                id: 'tx-recent-1',
                type: 'income',
                amount: 5000,
                currency: 'USD',
                convertedAmount: 5000,
                date: '2026-11-01T00:00:00.000Z',
                description: 'Payroll Deposit',
                accountId: { name: 'Main Checking', type: 'bank', currency: 'USD' },
              },
            ],
            budgetAlerts: {
              warningCount: 0,
              exceededCount: 0,
              items: [],
            },
          },
        }),
      });
    });

    await page.goto('/dashboard');

    // Verify personalized greeting with Jordan Finch
    await expect(page.getByRole('heading', { name: /Jordan Finch/ })).toBeVisible();

    // Verify 4 KPI metric cards
    await expect(page.getByText('Total Net Balance')).toBeVisible();
    await expect(page.getByText('$6,500.00')).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('+$5,000.00').first()).toBeVisible();
    await expect(page.getByText('Monthly Expenses')).toBeVisible();
    await expect(page.getByText('-$2,000.00')).toBeVisible();
    await expect(page.getByText('Net Savings Rate')).toBeVisible();
    await expect(page.getByText('(60%)')).toBeVisible();

    // Verify Charts & Recent Activity
    await expect(page.getByText('Cash Flow Trend')).toBeVisible();
    await expect(page.getByText('Expense Breakdown')).toBeVisible();
    await expect(page.getByText('Recent Activity')).toBeVisible();
    await expect(page.getByText('Payroll Deposit')).toBeVisible();
  });

  test('verifies export buttons on /transactions page', async ({ page }) => {
    // Mock /api/accounts
    await page.route('**/api/accounts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { accounts: [] },
        }),
      });
    });

    // Mock /api/transactions
    await page.route('**/api/transactions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'tx-export-1',
              type: 'expense',
              amount: 15.5,
              currency: 'USD',
              convertedAmount: 15.5,
              date: '2026-11-04T00:00:00.000Z',
              description: 'Coffee Shop',
              accountId: { name: 'Cash', type: 'cash', currency: 'USD' },
            },
          ],
          pagination: {
            totalCount: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
            hasMore: false,
          },
        }),
      });
    });

    await page.goto('/transactions');

    // Verify Export CSV and Export PDF buttons are rendered and active
    const exportCsvBtn = page.getByRole('button', { name: /Export CSV/i });
    const exportPdfBtn = page.getByRole('button', { name: /Export PDF/i });

    await expect(exportCsvBtn).toBeVisible();
    await expect(exportPdfBtn).toBeVisible();
    await expect(exportCsvBtn).toBeEnabled();
    await expect(exportPdfBtn).toBeEnabled();
  });
});
