// server/tests/integration/budgets.test.ts

// Integration tests for monthly budget CRUD, real-time spending progress, and alert tiers.

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

describe('Budgets API (/api/budgets)', () => {
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
    const res = await request(app).get('/api/budgets');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('creates, retrieves with spending progress, updates, and deletes a category budget', async () => {
    if (!isDbConnected) return;

    const user = await createTestUser({ email: 'budgetuser@example.com' });
    const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

    const account = await Account.create({
      userId: user._id,
      name: 'Checking Account',
      type: 'bank',
      balance: 5000,
      currency: 'USD',
      color: '#3b82f6',
      icon: 'Building2',
      isArchived: false,
    });

    const category = await Category.create({
      userId: user._id,
      name: 'Dining & Food',
      type: 'expense',
      icon: 'Utensils',
      color: '#ef4444',
      isDefault: false,
    });

    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();

    // 1. Create a budget: limit $200 for Dining & Food
    const createRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category._id.toString(),
        month,
        year,
        limitAmount: 200,
        currency: 'USD',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.limitAmount).toBe(200);
    const budgetId = createRes.body.data._id;

    // 2. Reject duplicate budget creation for the same month/year
    const duplicateRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category._id.toString(),
        month,
        year,
        limitAmount: 250,
      });
    expect(duplicateRes.status).toBe(409);

    // 3. Query progress initially (spent = 0, alertTier = 'normal')
    let progressRes = await request(app)
      .get(`/api/budgets?month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${token}`);

    expect(progressRes.status).toBe(200);
    expect(progressRes.body.data.budgets).toHaveLength(1);
    expect(progressRes.body.data.budgets[0].spent).toBe(0);
    expect(progressRes.body.data.budgets[0].remaining).toBe(200);
    expect(progressRes.body.data.budgets[0].percentage).toBe(0);
    expect(progressRes.body.data.budgets[0].alertTier).toBe('normal');

    // 4. Create an expense of $170 (85% of $200 -> alertTier: 'warning')
    await Transaction.create({
      userId: user._id,
      accountId: account._id,
      type: 'expense',
      amount: 170,
      currency: 'USD',
      convertedAmount: 170,
      categoryId: category._id,
      date: new Date(Date.UTC(year, month - 1, 15)),
      description: 'Dinner with friends',
    });

    progressRes = await request(app)
      .get(`/api/budgets?month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${token}`);

    expect(progressRes.body.data.budgets[0].spent).toBe(170);
    expect(progressRes.body.data.budgets[0].remaining).toBe(30);
    expect(progressRes.body.data.budgets[0].percentage).toBe(85);
    expect(progressRes.body.data.budgets[0].alertTier).toBe('warning');

    // 5. Add another expense of $50 (Total: $220 / $200 = 110% -> alertTier: 'exceeded')
    await Transaction.create({
      userId: user._id,
      accountId: account._id,
      type: 'expense',
      amount: 50,
      currency: 'USD',
      convertedAmount: 50,
      categoryId: category._id,
      date: new Date(Date.UTC(year, month - 1, 20)),
      description: 'Coffee and snacks',
    });

    progressRes = await request(app)
      .get(`/api/budgets?month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${token}`);

    expect(progressRes.body.data.budgets[0].spent).toBe(220);
    expect(progressRes.body.data.budgets[0].remaining).toBe(-20);
    expect(progressRes.body.data.budgets[0].percentage).toBe(110);
    expect(progressRes.body.data.budgets[0].alertTier).toBe('exceeded');
    expect(progressRes.body.data.totalBudgeted).toBe(200);
    expect(progressRes.body.data.totalSpent).toBe(220);

    // 6. Update budget limit to $300 (remaining: $80, percentage: 73% -> alertTier: 'normal')
    const updateRes = await request(app)
      .patch(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ limitAmount: 300 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.limitAmount).toBe(300);

    progressRes = await request(app)
      .get(`/api/budgets?month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${token}`);
    expect(progressRes.body.data.budgets[0].remaining).toBe(80);
    expect(progressRes.body.data.budgets[0].alertTier).toBe('normal');

    // 7. Delete budget
    const deleteRes = await request(app)
      .delete(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    // Confirm budget deleted
    progressRes = await request(app)
      .get(`/api/budgets?month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${token}`);
    expect(progressRes.body.data.budgets).toHaveLength(0);
  });

  it('prevents cross-user mutation or access to budgets', async () => {
    if (!isDbConnected) return;

    const userA = await createTestUser({ email: 'userA_budget@example.com' });
    const userB = await createTestUser({ email: 'userB_budget@example.com' });
    const tokenB = generateAccessToken({ userId: userB._id.toString(), email: userB.email });

    const categoryA = await Category.create({
      userId: userA._id,
      name: 'User A Expenses',
      type: 'expense',
      icon: 'Briefcase',
      color: '#6366f1',
      isDefault: false,
    });

    const budgetA = await Budget.create({
      userId: userA._id,
      categoryId: categoryA._id,
      month: 5,
      year: 2026,
      limitAmount: 500,
      currency: 'USD',
    });

    // User B tries to update User A's budget
    const updateRes = await request(app)
      .patch(`/api/budgets/${budgetA._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ limitAmount: 1000 });
    expect(updateRes.status).toBe(404);

    // User B tries to delete User A's budget
    const deleteRes = await request(app)
      .delete(`/api/budgets/${budgetA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(deleteRes.status).toBe(404);
  });
});
