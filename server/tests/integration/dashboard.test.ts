// server/tests/integration/dashboard.test.ts

// Integration tests for the unified dashboard analytics and summary API.

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Account } from '../../src/models/Account.js';
import { Budget } from '../../src/models/Budget.js';
import { Category } from '../../src/models/Category.js';
import { Transaction } from '../../src/models/Transaction.js';
import { generateAccessToken } from '../../src/utils/tokenUtils.js';
import { createTestUser } from '../fixtures/authFixtures.js';
import { clearTestDb, setupTestDb, teardownTestDb } from '../setupDb.js';

describe('Dashboard Summary API (/api/dashboard/summary)', () => {
  let isDbConnected = false;

  beforeAll(async () => {
    isDbConnected = await setupTestDb();
  });

  afterAll(async () => {
    if (isDbConnected) {
      await clearTestDb();
      await teardownTestDb();
    }
  });

  beforeEach(async () => {
    if (isDbConnected) {
      await clearTestDb();
    }
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('calculates total balance, monthly KPIs, 6-month cash flow, and category breakdown', async () => {
    if (!isDbConnected) return;

    const user = await createTestUser({ email: 'dashuser@example.com' });
    const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

    // Create 2 accounts: Bank ($2,000) and Cash ($500)
    const bank = await Account.create({
      userId: user._id,
      name: 'City Bank',
      type: 'bank',
      balance: 2000,
      currency: 'USD',
      color: '#3b82f6',
      icon: 'Building2',
      isArchived: false,
    });

    await Account.create({
      userId: user._id,
      name: 'Physical Wallet',
      type: 'cash',
      balance: 500,
      currency: 'USD',
      color: '#10b981',
      icon: 'Wallet',
      isArchived: false,
    });

    // Categories
    const salaryCat = await Category.create({
      userId: user._id,
      name: 'Salary',
      type: 'income',
      icon: 'DollarSign',
      color: '#10b981',
      isDefault: true,
    });

    const foodCat = await Category.create({
      userId: user._id,
      name: 'Dining',
      type: 'expense',
      icon: 'Utensils',
      color: '#ef4444',
      isDefault: false,
    });

    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    // Transactions in current month
    await Transaction.create({
      userId: user._id,
      accountId: bank._id,
      type: 'income',
      amount: 4000,
      currency: 'USD',
      convertedAmount: 4000,
      categoryId: salaryCat._id,
      date: new Date(Date.UTC(currentYear, currentMonth, 5)),
      description: 'Monthly Salary',
    });

    await Transaction.create({
      userId: user._id,
      accountId: bank._id,
      type: 'expense',
      amount: 1000,
      currency: 'USD',
      convertedAmount: 1000,
      categoryId: foodCat._id,
      date: new Date(Date.UTC(currentYear, currentMonth, 10)),
      description: 'Groceries & Dinners',
    });

    // Create budget limit of $800 (spent $1000 => alertTier: 'exceeded')
    await Budget.create({
      userId: user._id,
      categoryId: foodCat._id,
      month: currentMonth + 1,
      year: currentYear,
      limitAmount: 800,
      currency: 'USD',
    });

    // Fetch dashboard summary
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.totalBalance).toBe(2500);
    expect(data.monthlyIncome).toBe(4000);
    expect(data.monthlyExpenses).toBe(1000);
    expect(data.netSavings).toBe(3000);
    expect(data.savingsRate).toBe(75); // (3000 / 4000) * 100
    expect(data.currency).toBe('USD');

    // 6-month cash flow series check
    expect(data.cashFlowSeries).toHaveLength(6);
    const lastPoint = data.cashFlowSeries[5];
    expect(lastPoint.income).toBe(4000);
    expect(lastPoint.expense).toBe(1000);
    expect(lastPoint.net).toBe(3000);

    // Category breakdown check
    expect(data.categoryBreakdown).toHaveLength(1);
    expect(data.categoryBreakdown[0].name).toBe('Dining');
    expect(data.categoryBreakdown[0].amount).toBe(1000);
    expect(data.categoryBreakdown[0].percentage).toBe(100);

    // Recent transactions check
    expect(data.recentTransactions).toHaveLength(2);

    // Budget alerts check
    expect(data.budgetAlerts.exceededCount).toBe(1);
  });
});
