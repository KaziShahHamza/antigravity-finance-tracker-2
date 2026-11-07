// client/e2e/auth.spec.ts

// Playwright end-to-end tests verifying the complete authentication journey, OTP verification, and route guards.

import { expect, test } from '@playwright/test';

test.describe('Authentication Journey & Dashboard Shell', () => {
  test('redirects unauthenticated users trying to access protected /dashboard to /login', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('completes registration -> OTP verification -> dashboard shell -> sign out', async ({
    page,
  }) => {
    // Intercept backend auth calls for deterministic, isolated testing
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Registration successful.',
          email: 'e2e_user@example.com',
        }),
      });
    });

    await page.route('**/api/auth/verify-otp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          accessToken: 'e2e_mock_access_jwt',
          refreshToken: 'e2e_mock_refresh_jwt',
          user: {
            id: 'e2e_user_123',
            name: 'Alex E2E',
            email: 'e2e_user@example.com',
            defaultCurrency: 'USD',
            themePreference: 'system',
            isVerified: true,
          },
        }),
      });
    });

    await page.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Logged out successfully.' }),
      });
    });

    // 1. Visit registration page and wait for client hydration
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Toggle theme/i })).toBeVisible();

    // 2. Fill registration form and confirm controlled state
    const nameInput = page.locator('#register-name');
    const emailInput = page.locator('#register-email');
    const passwordInput = page.locator('#register-password');
    const confirmInput = page.locator('#register-confirm-password');

    await nameInput.fill('Alex E2E');
    await emailInput.fill('e2e_user@example.com');
    await passwordInput.fill('Password123');
    await confirmInput.fill('Password123');
    await page.selectOption('#register-currency', 'USD');

    await expect(nameInput).toHaveValue('Alex E2E');
    await expect(emailInput).toHaveValue('e2e_user@example.com');

    // 3. Submit registration
    await page.getByRole('button', { name: 'Create Account' }).click();

    // 4. Verify redirection to OTP page
    await expect(page).toHaveURL(/.*\/verify-otp\?email=e2e_user%40example\.com/);
    await expect(page.getByRole('heading', { name: 'Verify Your Account' })).toBeVisible();

    // 5. Fill 6 OTP digits
    for (let i = 0; i < 6; i++) {
      await page.locator(`#otp-digit-${i}`).fill(`${i + 1}`);
    }

    // 6. Submit OTP verification
    await page.getByRole('button', { name: 'Verify & Continue' }).click();

    // 7. Verify navigation to Dashboard Shell
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByRole('heading', { name: /Alex E2E/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Accounts' }).first()).toBeVisible();

    // 8. Verify Sidebar navigation links exist
    await expect(page.getByRole('link', { name: 'Accounts' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Transactions' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Budgets' }).first()).toBeVisible();

    // 9. Sign out
    await page.getByRole('button', { name: /Sign Out/i }).click();

    // 10. Verify redirected back to Login page
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('allows logging in with existing credentials', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          accessToken: 'login_access_jwt',
          refreshToken: 'login_refresh_jwt',
          user: {
            id: 'existing_user_456',
            name: 'Sarah Connor',
            email: 'sarah@example.com',
            defaultCurrency: 'EUR',
            themePreference: 'dark',
            isVerified: true,
          },
        }),
      });
    });

    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Toggle theme/i })).toBeVisible();

    await page.fill('#login-email', 'sarah@example.com');
    await page.fill('#login-password', 'Password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByRole('heading', { name: /Sarah Connor/ })).toBeVisible();
  });

  test('allows signing in via Google mock fallback in development', async ({ page }) => {
    await page.route('**/api/auth/google', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          accessToken: 'google_access_jwt',
          refreshToken: 'google_refresh_jwt',
          user: {
            id: 'google_user_789',
            name: 'Google User',
            email: 'google@example.com',
            defaultCurrency: 'USD',
            themePreference: 'system',
            isVerified: true,
          },
        }),
      });
    });

    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Toggle theme/i })).toBeVisible();
    await page.getByRole('button', { name: 'Continue with Google' }).click();

    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByRole('heading', { name: /Google User/ })).toBeVisible();
  });
});
