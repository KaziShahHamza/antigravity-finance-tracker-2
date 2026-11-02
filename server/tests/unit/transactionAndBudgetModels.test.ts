// server/tests/unit/transactionAndBudgetModels.test.ts

// Unit tests validating schema rules and defaults for Transaction and Budget models.

import { describe, it, expect } from 'vitest';
import { Transaction } from '../../src/models/Transaction.js';
import { Budget } from '../../src/models/Budget.js';
import mongoose from 'mongoose';

describe('Transaction & Budget Models (Unit Schema Validation)', () => {
  describe('Transaction Model', () => {
    it('validates a standard income transaction', () => {
      const tx = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        type: 'income',
        amount: 2500,
        currency: 'usd',
        convertedAmount: 2500,
        categoryId: new mongoose.Types.ObjectId(),
        description: 'Monthly Salary',
      });

      const err = tx.validateSync();
      expect(err).toBeUndefined();
      expect(tx.currency).toBe('USD');
      expect(tx.isDemo).toBe(false);
      expect(tx.date).toBeInstanceOf(Date);
    });

    it('validates a transfer transaction with destination account details', () => {
      const tx = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        destinationAccountId: new mongoose.Types.ObjectId(),
        type: 'transfer',
        amount: 50,
        currency: 'USD',
        convertedAmount: 50,
        destinationAmount: 5500,
        destinationCurrency: 'BDT',
        description: 'Transfer to bKash',
      });

      const err = tx.validateSync();
      expect(err).toBeUndefined();
      expect(tx.destinationCurrency).toBe('BDT');
    });

    it('rejects an invalid transaction type', () => {
      const tx = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        type: 'crypto_swap', // invalid enum
        amount: 100,
        currency: 'USD',
        convertedAmount: 100,
        description: 'Test',
      });

      const err = tx.validateSync();
      expect(err?.errors['type']).toBeDefined();
    });

    it('rejects transactions with zero or negative amounts', () => {
      const tx = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        type: 'expense',
        amount: 0,
        currency: 'USD',
        convertedAmount: 0,
        description: 'Coffee',
      });

      const err = tx.validateSync();
      expect(err?.errors['amount']).toBeDefined();
    });
  });

  describe('Budget Model', () => {
    it('validates a correct budget limit', () => {
      const budget = new Budget({
        userId: new mongoose.Types.ObjectId(),
        categoryId: new mongoose.Types.ObjectId(),
        month: 11,
        year: 2026,
        limitAmount: 400,
        currency: 'usd',
      });

      const err = budget.validateSync();
      expect(err).toBeUndefined();
      expect(budget.currency).toBe('USD');
    });

    it('rejects invalid month numbers outside 1-12', () => {
      const budget = new Budget({
        userId: new mongoose.Types.ObjectId(),
        categoryId: new mongoose.Types.ObjectId(),
        month: 13, // invalid month
        year: 2026,
        limitAmount: 400,
      });

      const err = budget.validateSync();
      expect(err?.errors['month']).toBeDefined();
    });

    it('rejects zero or negative budget limit amounts', () => {
      const budget = new Budget({
        userId: new mongoose.Types.ObjectId(),
        categoryId: new mongoose.Types.ObjectId(),
        month: 6,
        year: 2026,
        limitAmount: 0,
      });

      const err = budget.validateSync();
      expect(err?.errors['limitAmount']).toBeDefined();
    });
  });
});
