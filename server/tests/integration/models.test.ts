// server/tests/integration/models.test.ts

// Integration tests verifying schema relationships, compound indexes, and model exports.

import { describe, it, expect } from 'vitest';
import { User } from '../../src/models/User.js';
import { ExchangeRate } from '../../src/models/ExchangeRate.js';
import { Account } from '../../src/models/Account.js';
import { Category } from '../../src/models/Category.js';
import { Transaction } from '../../src/models/Transaction.js';
import { Budget } from '../../src/models/Budget.js';

describe('Mongoose Models & Schema Indexes Integration', () => {
  it('verifies User schema indexes', () => {
    const indexes = User.schema.indexes();
    // Unique email index
    const emailIndex = indexes.find((idx) => 'email' in idx[0]);
    expect(emailIndex).toBeDefined();

    // Sparse googleId index
    const googleIdIndex = indexes.find((idx) => 'googleId' in idx[0]);
    expect(googleIdIndex).toBeDefined();
    expect(googleIdIndex?.[1]?.sparse).toBe(true);
  });

  it('verifies ExchangeRate TTL expiration index', () => {
    const indexes = ExchangeRate.schema.indexes();
    const ttlIndex = indexes.find((idx) => 'expiresAt' in idx[0]);
    expect(ttlIndex).toBeDefined();
    expect(ttlIndex?.[1]?.expireAfterSeconds).toBe(0);
  });

  it('verifies Account compound indexes', () => {
    const indexes = Account.schema.indexes();
    const compoundIndex = indexes.find((idx) => 'userId' in idx[0] && 'isArchived' in idx[0]);
    expect(compoundIndex).toBeDefined();
  });

  it('verifies Category compound indexes', () => {
    const indexes = Category.schema.indexes();
    const typeIndex = indexes.find((idx) => 'userId' in idx[0] && 'type' in idx[0]);
    expect(typeIndex).toBeDefined();
  });

  it('verifies Transaction history compound indexes', () => {
    const indexes = Transaction.schema.indexes();
    const userDateIndex = indexes.find((idx) => 'userId' in idx[0] && 'date' in idx[0]);
    expect(userDateIndex).toBeDefined();
    expect(userDateIndex?.[0].date).toBe(-1); // Descending for chronologically recent sorting

    const categoryDateIndex = indexes.find(
      (idx) => 'userId' in idx[0] && 'categoryId' in idx[0] && 'date' in idx[0]
    );
    expect(categoryDateIndex).toBeDefined();
  });

  it('verifies Budget compound unique index', () => {
    const indexes = Budget.schema.indexes();
    const uniqueBudgetIndex = indexes.find(
      (idx) => 'userId' in idx[0] && 'categoryId' in idx[0] && 'month' in idx[0] && 'year' in idx[0]
    );
    expect(uniqueBudgetIndex).toBeDefined();
    expect(uniqueBudgetIndex?.[1]?.unique).toBe(true);
  });
});
