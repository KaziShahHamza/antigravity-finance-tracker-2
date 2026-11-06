// server/tests/integration/transactions.test.ts

// Integration tests for categories, transactions, atomic balance reconciliation, and search/filter pagination.

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Account } from '../../src/models/Account.js';
import { Category } from '../../src/models/Category.js';
import { Transaction } from '../../src/models/Transaction.js';
import { generateAccessToken } from '../../src/utils/tokenUtils.js';
import { createTestUser } from '../fixtures/authFixtures.js';
import { clearTestDb, setupTestDb, teardownTestDb } from '../setupDb.js';

describe('Categories & Transactions API (/api/categories & /api/transactions)', () => {
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

  describe('Categories Endpoints (/api/categories)', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('creates, retrieves, updates, and deletes custom categories while protecting defaults', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'catuser@example.com' });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      // Create default category
      const defaultCat = await Category.create({
        userId: user._id,
        name: 'Groceries',
        type: 'expense',
        icon: 'ShoppingBag',
        color: '#10b981',
        isDefault: true,
      });

      // 1. GET /api/categories
      const getRes = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.length).toBe(1);
      expect(getRes.body.data[0].name).toBe('Groceries');

      // 2. POST /api/categories (custom category)
      const createRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Gym & Fitness',
          type: 'expense',
          icon: 'Dumbbell',
          color: '#3b82f6',
        });
      expect(createRes.status).toBe(201);
      expect(createRes.body.data.name).toBe('Gym & Fitness');
      expect(createRes.body.data.isDefault).toBe(false);
      const customCatId = createRes.body.data._id;

      // 3. Prevent duplicate category within same type
      const dupRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'gym & fitness',
          type: 'expense',
        });
      expect(dupRes.status).toBe(400);

      // 4. PATCH /api/categories/:id
      const updateRes = await request(app)
        .patch(`/api/categories/${customCatId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Fitness & Health',
          color: '#22c55e',
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Fitness & Health');

      // 5. DELETE system default category fails with 400
      const delDefRes = await request(app)
        .delete(`/api/categories/${defaultCat._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(delDefRes.status).toBe(400);
      expect(delDefRes.body.message).toMatch(/default/i);

      // 6. DELETE custom category succeeds
      const delCustomRes = await request(app)
        .delete(`/api/categories/${customCatId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(delCustomRes.status).toBe(200);
    });
  });

  describe('Transaction CRUD & Balance Reconciliation', () => {
    it('creates income and expense transactions and updates account balance atomically', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'txuser@example.com' });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const account = await Account.create({
        userId: user._id,
        name: 'Main Bank',
        type: 'bank',
        balance: 1000,
        currency: 'USD',
      });

      const category = await Category.create({
        userId: user._id,
        name: 'Salary',
        type: 'income',
        isDefault: true,
      });

      // 1. Create Income: balance increases from 1000 to 1500
      const incomeRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId: account._id.toString(),
          type: 'income',
          amount: 500,
          categoryId: category._id.toString(),
          description: 'Monthly Salary',
        });
      expect(incomeRes.status).toBe(201);
      expect(incomeRes.body.data.amount).toBe(500);

      const updatedAccAfterIncome = await Account.findById(account._id);
      expect(updatedAccAfterIncome?.balance).toBe(1500);

      // 2. Create Expense: balance decreases from 1500 to 1350
      const expenseRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId: account._id.toString(),
          type: 'expense',
          amount: 150,
          description: 'Team Lunch',
        });
      expect(expenseRes.status).toBe(201);

      const updatedAccAfterExpense = await Account.findById(account._id);
      expect(updatedAccAfterExpense?.balance).toBe(1350);
    });

    it('correctly reverses prior balance impact when updating transaction amount and type', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'reconcile@example.com' });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const accountA = await Account.create({
        userId: user._id,
        name: 'Account A',
        type: 'bank',
        balance: 1000,
        currency: 'USD',
      });

      const accountB = await Account.create({
        userId: user._id,
        name: 'Account B',
        type: 'cash',
        balance: 500,
        currency: 'USD',
      });

      // 1. Create an expense of 100 on Account A -> balance becomes 900
      const createRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId: accountA._id.toString(),
          type: 'expense',
          amount: 100,
          description: 'Original Expense',
        });
      expect(createRes.status).toBe(201);
      const txId = createRes.body.data._id;

      let accA = await Account.findById(accountA._id);
      expect(accA?.balance).toBe(900);

      // 2. Update expense amount from 100 to 250 -> balance should become 1000 - 250 = 750
      const updateAmountRes = await request(app)
        .patch(`/api/transactions/${txId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 250 });
      expect(updateAmountRes.status).toBe(200);

      accA = await Account.findById(accountA._id);
      expect(accA?.balance).toBe(750);

      // 3. Switch account from Account A to Account B -> Account A becomes 1000, Account B becomes 500 - 250 = 250
      const switchAccRes = await request(app)
        .patch(`/api/transactions/${txId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId: accountB._id.toString() });
      expect(switchAccRes.status).toBe(200);

      accA = await Account.findById(accountA._id);
      let accB = await Account.findById(accountB._id);
      expect(accA?.balance).toBe(1000);
      expect(accB?.balance).toBe(250);

      // 4. Switch type from expense to income (250) on Account B -> Account B should become 500 + 250 = 750
      const switchTypeRes = await request(app)
        .patch(`/api/transactions/${txId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'income' });
      expect(switchTypeRes.status).toBe(200);

      accB = await Account.findById(accountB._id);
      expect(accB?.balance).toBe(750);
    });

    it('reverses balance impact upon transaction deletion', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'deltx@example.com' });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const account = await Account.create({
        userId: user._id,
        name: 'Wallet',
        type: 'cash',
        balance: 500,
        currency: 'USD',
      });

      const tx = await Transaction.create({
        userId: user._id,
        accountId: account._id,
        type: 'expense',
        amount: 80,
        currency: 'USD',
        convertedAmount: 80,
        description: 'Dinner',
        date: new Date(),
      });
      account.balance = 420;
      await account.save();

      const delRes = await request(app)
        .delete(`/api/transactions/${tx._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(delRes.status).toBe(200);

      const restoredAccount = await Account.findById(account._id);
      expect(restoredAccount?.balance).toBe(500);

      const checkTx = await Transaction.findById(tx._id);
      expect(checkTx).toBeNull();
    });
  });

  describe('Search, Filter, Sort & Pagination (/api/transactions)', () => {
    it('filters transactions by search term, type, and supports pagination', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'filteruser@example.com' });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const account = await Account.create({
        userId: user._id,
        name: 'Checking',
        type: 'bank',
        balance: 5000,
        currency: 'USD',
      });

      await Transaction.create([
        {
          userId: user._id,
          accountId: account._id,
          type: 'expense',
          amount: 25,
          currency: 'USD',
          convertedAmount: 25,
          description: 'Starbucks Coffee',
          vendor: 'Starbucks',
          date: new Date('2026-05-01'),
        },
        {
          userId: user._id,
          accountId: account._id,
          type: 'expense',
          amount: 85,
          currency: 'USD',
          convertedAmount: 85,
          description: 'Supermarket Grocery Run',
          vendor: 'Walmart',
          date: new Date('2026-05-02'),
        },
        {
          userId: user._id,
          accountId: account._id,
          type: 'income',
          amount: 2000,
          currency: 'USD',
          convertedAmount: 2000,
          description: 'Consulting Gig',
          vendor: 'Acme Corp',
          date: new Date('2026-05-03'),
        },
      ]);

      // 1. Search filter
      const searchRes = await request(app)
        .get('/api/transactions?search=Starbucks')
        .set('Authorization', `Bearer ${token}`);
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.length).toBe(1);
      expect(searchRes.body.data[0].vendor).toBe('Starbucks');

      // 2. Type filter
      const typeRes = await request(app)
        .get('/api/transactions?type=income')
        .set('Authorization', `Bearer ${token}`);
      expect(typeRes.status).toBe(200);
      expect(typeRes.body.data.length).toBe(1);
      expect(typeRes.body.data[0].type).toBe('income');

      // 3. Pagination
      const pageRes = await request(app)
        .get('/api/transactions?page=1&limit=2&sortBy=date&sortOrder=desc')
        .set('Authorization', `Bearer ${token}`);
      expect(pageRes.status).toBe(200);
      expect(pageRes.body.data.length).toBe(2);
      expect(pageRes.body.pagination.totalCount).toBe(3);
      expect(pageRes.body.pagination.totalPages).toBe(2);
      expect(pageRes.body.pagination.hasMore).toBe(true);
    });

    it('enforces strict cross-user access isolation', async () => {
      if (!isDbConnected) return;

      const userA = await createTestUser({ email: 'usera_sec@example.com' });
      const userB = await createTestUser({ email: 'userb_sec@example.com' });
      const tokenA = generateAccessToken({ userId: userA._id.toString(), email: userA.email });
      const tokenB = generateAccessToken({ userId: userB._id.toString(), email: userB.email });

      const accountB = await Account.create({
        userId: userB._id,
        name: 'Secret Vault',
        type: 'bank',
        balance: 10000,
        currency: 'USD',
      });

      const txB = await Transaction.create({
        userId: userB._id,
        accountId: accountB._id,
        type: 'expense',
        amount: 999,
        currency: 'USD',
        convertedAmount: 999,
        description: 'Private Transfer',
        date: new Date(),
      });

      // User A cannot read User B's transaction
      const getRes = await request(app)
        .get(`/api/transactions/${txB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(getRes.status).toBe(404);

      // User A cannot delete User B's transaction
      const delRes = await request(app)
        .delete(`/api/transactions/${txB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(delRes.status).toBe(404);

      // User B can access their own transaction
      const getBRes = await request(app)
        .get(`/api/transactions/${txB._id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(getBRes.status).toBe(200);
    });
  });
});
