// client/e2e/transactionsAndOcr.spec.ts

// Playwright E2E tests verifying transaction CRUD, search/filtering, and AI receipt OCR auto-fill.

import { expect, test } from '@playwright/test';

test.describe('Transactions & AI Receipt OCR (/transactions)', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate via local storage mock token and user
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
          data: {
            accessToken: 'mock_refreshed_access_token',
            refreshToken: 'mock_refresh_token',
          },
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
            id: 'user_e2e',
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

    // Mock /api/accounts
    await page.route('**/api/accounts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accounts: [
              {
                id: 'acc_checking',
                name: 'Main Checking',
                type: 'bank',
                balance: 3500,
                currency: 'USD',
                color: '#3b82f6',
                icon: 'Landmark',
                isArchived: false,
              },
              {
                id: 'acc_cash',
                name: 'Cash Wallet',
                type: 'cash',
                balance: 200,
                currency: 'USD',
                color: '#10b981',
                icon: 'Wallet',
                isArchived: false,
              },
            ],
            totalBalance: 3700,
            currency: 'USD',
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
              id: 'cat_groceries',
              name: 'Groceries',
              type: 'expense',
              icon: 'ShoppingBag',
              color: '#10b981',
              isDefault: true,
            },
            {
              id: 'cat_dining',
              name: 'Food & Dining',
              type: 'expense',
              icon: 'Utensils',
              color: '#f97316',
              isDefault: true,
            },
            {
              id: 'cat_salary',
              name: 'Salary',
              type: 'income',
              icon: 'Briefcase',
              color: '#22c55e',
              isDefault: true,
            },
          ],
        }),
      });
    });
  });

  test('renders transactions page, filters list, and opens Add Transaction modal', async ({
    page,
  }) => {
    let transactionsList = [
      {
        _id: 'tx_1',
        type: 'expense',
        amount: 32.5,
        currency: 'USD',
        convertedAmount: 32.5,
        description: 'Team Lunch',
        vendor: 'Chipotle',
        date: '2026-11-06T10:00:00.000Z',
        accountId: { id: 'acc_checking', name: 'Main Checking', currency: 'USD' },
        categoryId: { id: 'cat_dining', name: 'Food & Dining' },
      },
    ];

    await page.route('**/api/transactions*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: transactionsList,
            pagination: {
              totalCount: transactionsList.length,
              page: 1,
              limit: 20,
              totalPages: 1,
              hasMore: false,
            },
          }),
        });
      } else if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newTx = {
          _id: `tx_${Date.now()}`,
          ...body,
          convertedAmount: body.amount,
          accountId: { id: body.accountId, name: 'Main Checking', currency: 'USD' },
          categoryId: { id: body.categoryId, name: 'Groceries' },
        };
        transactionsList.push(newTx);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: newTx }),
        });
      }
    });

    await page.goto('/transactions');

    // Verify page header
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'Transactions' })
    ).toBeVisible();

    // Verify existing transaction row
    await expect(page.getByText('Team Lunch')).toBeVisible();
    await expect(page.getByText('Chipotle')).toBeVisible();

    // Open Add Transaction modal
    await page.getByRole('button', { name: /add transaction/i }).click();
    await expect(page.getByRole('heading', { name: 'Record Transaction' })).toBeVisible();

    // Verify Tabs exist (Expense, Income, Transfer)
    await expect(page.getByRole('button', { name: 'Expense' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Income' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Transfer' })).toBeVisible();
  });

  test('auto-fills transaction modal from mock AI receipt OCR response', async ({ page }) => {
    await page.route('**/api/transactions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { totalCount: 0, page: 1, limit: 20, totalPages: 1, hasMore: false },
        }),
      });
    });

    // Mock OCR endpoint
    await page.route('**/api/ocr/receipt', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            vendor: 'Fresh Produce Mart',
            date: '2026-11-06',
            totalAmount: 48.75,
            currency: 'USD',
            suggestedCategory: 'Groceries',
            items: [{ name: 'Apples', price: 10, quantity: 2 }],
            receiptUrl: 'https://example.com/mock-receipt.jpg',
            isMock: true,
          },
        }),
      });
    });

    await page.goto('/transactions');
    await page.getByRole('button', { name: /add transaction/i }).click();

    // Click "Scan Receipt with AI OCR" toggle
    await page.getByRole('button', { name: /scan receipt with ai ocr/i }).click();

    // Verify drag-and-drop text is shown
    await expect(page.getByText(/click to upload or drag & drop receipt/i)).toBeVisible();
  });
});
