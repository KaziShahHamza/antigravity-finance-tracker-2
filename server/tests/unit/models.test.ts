// server/tests/unit/models.test.ts

// Unit tests validating Mongoose schemas, defaults, and validation rules for User, ExchangeRate, Account, and Category.

import { describe, it, expect } from 'vitest';
import { User } from '../../src/models/User.js';
import { ExchangeRate } from '../../src/models/ExchangeRate.js';
import { Account } from '../../src/models/Account.js';
import { Category } from '../../src/models/Category.js';
import mongoose from 'mongoose';

describe('Mongoose Models (Unit Schema Validation)', () => {
  describe('User Model', () => {
    it('validates a correct user document', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123',
      });

      const err = user.validateSync();
      expect(err).toBeUndefined();
      expect(user.isVerified).toBe(false);
      expect(user.defaultCurrency).toBe('USD');
      expect(user.themePreference).toBe('system');
    });

    it('requires password if googleId is missing', () => {
      const user = new User({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      const err = user.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['password']).toBeDefined();
    });

    it('allows missing password if googleId is present', () => {
      const user = new User({
        name: 'Google User',
        email: 'google@example.com',
        googleId: '1234567890',
        isVerified: true,
      });

      const err = user.validateSync();
      expect(err).toBeUndefined();
    });

    it('enforces email and name requirements', () => {
      const user = new User({});
      const err = user.validateSync();
      expect(err?.errors['name']).toBeDefined();
      expect(err?.errors['email']).toBeDefined();
    });
  });

  describe('ExchangeRate Model', () => {
    it('validates a correct exchange rate cache entry', () => {
      const rateDoc = new ExchangeRate({
        baseCurrency: 'usd',
        rates: { EUR: 0.92, BDT: 110.5 },
        expiresAt: new Date(Date.now() + 86400000),
      });

      const err = rateDoc.validateSync();
      expect(err).toBeUndefined();
      expect(rateDoc.baseCurrency).toBe('USD'); // Uppercase setter
    });

    it('fails if baseCurrency or rates are missing', () => {
      const rateDoc = new ExchangeRate({});
      const err = rateDoc.validateSync();
      expect(err?.errors['rates']).toBeDefined();
      expect(err?.errors['expiresAt']).toBeDefined();
    });
  });

  describe('Account Model', () => {
    it('validates a correct account with valid wallet type', () => {
      const account = new Account({
        userId: new mongoose.Types.ObjectId(),
        name: 'City Bank Checking',
        type: 'bank',
        balance: 1500.5,
        currency: 'usd',
      });

      const err = account.validateSync();
      expect(err).toBeUndefined();
      expect(account.currency).toBe('USD');
      expect(account.isArchived).toBe(false);
    });

    it('accepts valid wallet types (cash, bank, bkash, nagad, credit, other)', () => {
      const validTypes = ['cash', 'bank', 'bkash', 'nagad', 'credit', 'other'] as const;
      validTypes.forEach((walletType) => {
        const account = new Account({
          userId: new mongoose.Types.ObjectId(),
          name: `${walletType} test`,
          type: walletType,
          balance: 0,
        });
        const err = account.validateSync();
        expect(err).toBeUndefined();
      });
    });

    it('rejects an invalid wallet type', () => {
      const account = new Account({
        userId: new mongoose.Types.ObjectId(),
        name: 'Bitcoin Wallet',
        type: 'crypto', // invalid
        balance: 100,
      });

      const err = account.validateSync();
      expect(err?.errors['type']).toBeDefined();
    });
  });

  describe('Category Model', () => {
    it('validates income and expense categories', () => {
      const expenseCat = new Category({
        name: 'Groceries',
        type: 'expense',
        icon: 'ShoppingCart',
        color: '#f59e0b',
        isDefault: true,
      });

      const err = expenseCat.validateSync();
      expect(err).toBeUndefined();
      expect(expenseCat.isDefault).toBe(true);
    });

    it('rejects an invalid category type', () => {
      const category = new Category({
        name: 'Dividends',
        type: 'investment', // invalid enum
      });

      const err = category.validateSync();
      expect(err?.errors['type']).toBeDefined();
    });
  });
});
