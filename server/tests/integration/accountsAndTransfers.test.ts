// server/tests/integration/accountsAndTransfers.test.ts

// Integration tests for account CRUD, user data isolation, and atomic cross-currency fund transfers.

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Account } from '../../src/models/Account.js';
import { Transaction } from '../../src/models/Transaction.js';
import { generateAccessToken } from '../../src/utils/tokenUtils.js';
import { createTestUser } from '../fixtures/authFixtures.js';
import { clearTestDb, setupTestDb, teardownTestDb } from '../setupDb.js';

describe('Accounts & Transfers API (/api/accounts)', () => {
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

  describe('GET /api/accounts', () => {
    it('rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/accounts');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns accounts with converted balances and enforces user isolation', async () => {
      if (!isDbConnected) return;

      const userA = await createTestUser({
        email: 'usera@example.com',
        defaultCurrency: 'USD',
        customExchangeRates: new Map([['BDT', 110]]),
      });
      const userB = await createTestUser({ email: 'userb@example.com', defaultCurrency: 'USD' });

      await Account.create([
        {
          userId: userA._id,
          name: 'Checking Account',
          type: 'bank',
          balance: 1000,
          currency: 'USD',
        },
        {
          userId: userA._id,
          name: 'bKash Wallet',
          type: 'bkash',
          balance: 11000,
          currency: 'BDT',
        },
        {
          userId: userB._id,
          name: 'User B Bank',
          type: 'bank',
          balance: 5000,
          currency: 'USD',
        },
      ]);

      const tokenA = generateAccessToken({ userId: userA._id.toString(), email: userA.email });

      const res = await request(app).get('/api/accounts').set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accounts).toHaveLength(2);
      expect(res.body.data.currency).toBe('USD');

      // 1000 USD + (11000 BDT / 110 = 100 USD) = 1100 USD total
      expect(res.body.data.totalBalance).toBe(1100);

      // Verify User B's account is completely isolated
      const names = res.body.data.accounts.map((a: { name: string }) => a.name);
      expect(names).not.toContain('User B Bank');
    });
  });

  describe('POST /api/accounts', () => {
    it('creates an account with rounded balance and defaults', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'creator@example.com' });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Personal Savings',
          type: 'bank',
          balance: 2500.556,
          currency: 'USD',
          color: '#3b82f6',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Personal Savings');
      expect(res.body.data.balance).toBe(2500.56); // 2-decimal rounded
      expect(res.body.data.isArchived).toBe(false);
    });

    it('rejects invalid account data', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'validator@example.com' });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '',
          type: 'invalid-wallet-type',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/accounts/:id', () => {
    it('updates account fields for owner', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'updater@example.com' });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const account = await Account.create({
        userId: user._id,
        name: 'Old Wallet Name',
        type: 'cash',
        balance: 50,
        currency: 'USD',
      });

      const res = await request(app)
        .patch(`/api/accounts/${account._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Wallet Name',
          balance: 75.25,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Wallet Name');
      expect(res.body.data.balance).toBe(75.25);
    });

    it('denies update on account belonging to another user', async () => {
      if (!isDbConnected) return;

      const userA = await createTestUser({ email: 'usera2@example.com' });
      const userB = await createTestUser({ email: 'userb2@example.com' });

      const accountB = await Account.create({
        userId: userB._id,
        name: 'User B Secret',
        type: 'bank',
        balance: 1000,
        currency: 'USD',
      });

      const tokenA = generateAccessToken({ userId: userA._id.toString(), email: userA.email });

      const res = await request(app)
        .patch(`/api/accounts/${accountB._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('hard-deletes account if no transactions exist', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'deleter@example.com' });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const account = await Account.create({
        userId: user._id,
        name: 'Empty Account',
        type: 'cash',
        balance: 0,
        currency: 'USD',
      });

      const res = await request(app)
        .delete(`/api/accounts/${account._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.archived).toBe(false);

      const found = await Account.findById(account._id);
      expect(found).toBeNull();
    });

    it('soft-archives account if associated transactions exist', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'archiver@example.com' });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const account = await Account.create({
        userId: user._id,
        name: 'Account With Tx',
        type: 'bank',
        balance: 500,
        currency: 'USD',
      });

      await Transaction.create({
        userId: user._id,
        accountId: account._id,
        type: 'income',
        amount: 500,
        currency: 'USD',
        convertedAmount: 500,
        description: 'Initial deposit',
        date: new Date(),
      });

      const res = await request(app)
        .delete(`/api/accounts/${account._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.archived).toBe(true);

      const found = await Account.findById(account._id);
      expect(found?.isArchived).toBe(true);
    });
  });

  describe('POST /api/accounts/transfer', () => {
    it('executes atomic transfer between accounts in same currency', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'transferuser@example.com' });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const fromAcc = await Account.create({
        userId: user._id,
        name: 'Bank Account',
        type: 'bank',
        balance: 1000,
        currency: 'USD',
      });

      const toAcc = await Account.create({
        userId: user._id,
        name: 'Cash Wallet',
        type: 'cash',
        balance: 200,
        currency: 'USD',
      });

      const res = await request(app)
        .post('/api/accounts/transfer')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fromAccountId: fromAcc._id.toString(),
          toAccountId: toAcc._id.toString(),
          amount: 300,
          description: 'ATM Cash Withdrawal',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fromAccount.balance).toBe(700);
      expect(res.body.data.toAccount.balance).toBe(500);

      // Verify transaction record was created
      const tx = await Transaction.findOne({ userId: user._id, type: 'transfer' });
      expect(tx).not.toBeNull();
      expect(tx?.amount).toBe(300);
      expect(tx?.destinationAmount).toBe(300);
      expect(tx?.accountId.toString()).toBe(fromAcc._id.toString());
      expect(tx?.destinationAccountId?.toString()).toBe(toAcc._id.toString());
    });

    it('executes cross-currency transfer with exchange rate conversion', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({
        email: 'crosstransfer@example.com',
        customExchangeRates: new Map([['BDT', 110]]),
      });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      // USD Bank ($1000) -> BDT bKash (0 BDT)
      const fromAcc = await Account.create({
        userId: user._id,
        name: 'US Bank',
        type: 'bank',
        balance: 1000,
        currency: 'USD',
      });

      const toAcc = await Account.create({
        userId: user._id,
        name: 'bKash',
        type: 'bkash',
        balance: 0,
        currency: 'BDT',
      });

      // Transfer 100 USD (at baseline 1 USD = 110 BDT -> 11,000 BDT)
      const res = await request(app)
        .post('/api/accounts/transfer')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fromAccountId: fromAcc._id.toString(),
          toAccountId: toAcc._id.toString(),
          amount: 100,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.fromAccount.balance).toBe(900);
      expect(res.body.data.toAccount.balance).toBe(11000);

      const tx = await Transaction.findById(res.body.data.transaction._id);
      expect(tx?.amount).toBe(100);
      expect(tx?.currency).toBe('USD');
      expect(tx?.destinationAmount).toBe(11000);
      expect(tx?.destinationCurrency).toBe('BDT');
    });

    it('rejects transfer when source account has insufficient funds', async () => {
      if (!isDbConnected) return;

      const user = await createTestUser({ email: 'broke@example.com' });
      const token = generateAccessToken({ userId: user._id.toString(), email: user.email });

      const fromAcc = await Account.create({
        userId: user._id,
        name: 'Empty Wallet',
        type: 'cash',
        balance: 50,
        currency: 'USD',
      });

      const toAcc = await Account.create({
        userId: user._id,
        name: 'Savings',
        type: 'bank',
        balance: 100,
        currency: 'USD',
      });

      const res = await request(app)
        .post('/api/accounts/transfer')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fromAccountId: fromAcc._id.toString(),
          toAccountId: toAcc._id.toString(),
          amount: 150,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient funds');
    });
  });
});
