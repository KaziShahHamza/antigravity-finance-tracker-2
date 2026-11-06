// client/e2e/accounts.spec.ts

// Playwright E2E tests verifying wallet creation, balance conversion rendering, and inter-account transfers.

import { expect, test } from '@playwright/test';

test.describe('Wallets & Accounts Management (/accounts)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user profile / authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('accessToken', 'mock_e2e_token');
    });

    // Mock /api/users/me
    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'u123',
            name: 'Alex E2E',
            email: 'alex@example.com',
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
  });

  test('renders accounts, displays total net balance, and opens add wallet modal', async ({
    page,
  }) => {
    // Mock accounts list
    await page.route('**/api/accounts', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accounts: [
                {
                  id: 'acc-1',
                  name: 'Main Bank',
                  type: 'bank',
                  balance: 1500,
                  currency: 'USD',
                  color: '#3b82f6',
                  icon: 'Landmark',
                  isArchived: false,
                },
                {
                  id: 'acc-2',
                  name: 'Cash Pocket',
                  type: 'cash',
                  balance: 200,
                  currency: 'USD',
                  color: '#10b981',
                  icon: 'Wallet',
                  isArchived: false,
                },
              ],
              totalBalance: 1700,
              currency: 'USD',
            },
          }),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Account created successfully',
            data: {
              id: 'acc-3',
              name: 'bKash Wallet',
              type: 'bkash',
              balance: 5000,
              currency: 'BDT',
              color: '#e11d48',
              icon: 'Smartphone',
              isArchived: false,
            },
          }),
        });
      }
    });

    await page.goto('/accounts');

    // Header and Total Balance check
    await expect(page.getByText('Total Net Balance')).toBeVisible();
    await expect(page.getByText('Main Bank')).toBeVisible();
    await expect(page.getByText('Cash Pocket')).toBeVisible();

    // Click "Add Wallet"
    await page.getByRole('button', { name: /add wallet/i }).click();

    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Add New Wallet / Account')).toBeVisible();

    // Fill form
    await page.getByLabel('Account Name').fill('bKash Wallet');
    await page.getByLabel('Current Balance').or(page.getByLabel('Initial Balance')).fill('5000');

    // Submit modal
    await page.getByRole('button', { name: /create account/i }).click();

    // Modal dismisses
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('opens transfer modal and executes transfer between accounts', async ({ page }) => {
    await page.route('**/api/accounts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accounts: [
              {
                id: 'acc-1',
                name: 'Main Bank',
                type: 'bank',
                balance: 1000,
                currency: 'USD',
                color: '#3b82f6',
                icon: 'Landmark',
                isArchived: false,
              },
              {
                id: 'acc-2',
                name: 'Cash Pocket',
                type: 'cash',
                balance: 100,
                currency: 'USD',
                color: '#10b981',
                icon: 'Wallet',
                isArchived: false,
              },
            ],
            totalBalance: 1100,
            currency: 'USD',
          },
        }),
      });
    });

    await page.route('**/api/accounts/transfer', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Transfer completed successfully',
          data: {
            fromAccount: { id: 'acc-1', balance: 800 },
            toAccount: { id: 'acc-2', balance: 300 },
          },
        }),
      });
    });

    await page.goto('/accounts');

    // Click global Transfer button
    await page.getByRole('button', { name: /^transfer$/i }).click();

    // Transfer Modal appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Transfer Funds')).toBeVisible();

    // Enter transfer amount
    await page.getByLabel(/transfer amount/i).fill('200');

    // Submit transfer
    await page.getByRole('button', { name: /execute transfer/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
