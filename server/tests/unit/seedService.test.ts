// server/tests/unit/seedService.test.ts

// Unit tests for seedService defaults, structure, and idempotent logic.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { DEFAULT_CATEGORIES, seedUserDefaults } from '../../src/services/seedService.js';
import { Category } from '../../src/models/Category.js';
import { Account } from '../../src/models/Account.js';

describe('seedService (unit)', () => {
  const dummyUserId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('DEFAULT_CATEGORIES configuration', () => {
    it('contains exactly 12 predefined categories', () => {
      expect(DEFAULT_CATEGORIES).toHaveLength(12);
    });

    it('contains exactly 9 expense and 3 income categories', () => {
      const expenses = DEFAULT_CATEGORIES.filter((c) => c.type === 'expense');
      const incomes = DEFAULT_CATEGORIES.filter((c) => c.type === 'income');

      expect(expenses).toHaveLength(9);
      expect(incomes).toHaveLength(3);
    });

    it('contains all required categories specified in AGENTS.md', () => {
      const requiredNames = [
        'Food & Dining',
        'Rent & Housing',
        'Groceries',
        'Shopping',
        'Transportation',
        'Utilities',
        'Entertainment',
        'Health',
        'Other',
        'Salary',
        'Freelance',
        'Investment',
      ];

      const presentNames = DEFAULT_CATEGORIES.map((c) => c.name);
      for (const name of requiredNames) {
        expect(presentNames).toContain(name);
      }
    });

    it('ensures each category has valid non-empty icon and color hex', () => {
      for (const cat of DEFAULT_CATEGORIES) {
        expect(cat.name).toBeTruthy();
        expect(cat.icon).toBeTruthy();
        expect(cat.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });
  });

  describe('seedUserDefaults logic', () => {
    it('creates all 12 categories and Main Checking account when user has none', async () => {
      vi.spyOn(Category, 'find').mockReturnValue({
        select: vi.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Category.find>);

      const insertManySpy = vi
        .spyOn(Category, 'insertMany')
        .mockResolvedValue(
          new Array(12).fill({}) as unknown as Awaited<ReturnType<typeof Category.insertMany>>
        );

      vi.spyOn(Account, 'countDocuments').mockResolvedValue(0);

      const fakeAccount = {
        _id: new Types.ObjectId(),
        name: 'Main Checking',
        balance: 0,
        currency: 'USD',
      };
      const accountCreateSpy = vi
        .spyOn(Account, 'create')
        .mockResolvedValue(fakeAccount as unknown as Awaited<ReturnType<typeof Account.create>>);

      const result = await seedUserDefaults(dummyUserId, 'USD');

      expect(result.categoriesCreated).toBe(12);
      expect(result.accountCreated).toBe(true);
      expect(result.account).toBeDefined();

      expect(insertManySpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Food & Dining', isDefault: true }),
          expect.objectContaining({ name: 'Salary', isDefault: true }),
        ])
      );
      expect(accountCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Main Checking',
          type: 'bank',
          balance: 0,
          currency: 'USD',
        })
      );
    });

    it('is idempotent and skips seeding when categories and account already exist', async () => {
      // Mock that all 12 categories already exist
      vi.spyOn(Category, 'find').mockReturnValue({
        select: vi.fn().mockResolvedValue(DEFAULT_CATEGORIES.map((c) => ({ name: c.name }))),
      } as unknown as ReturnType<typeof Category.find>);

      const insertManySpy = vi.spyOn(Category, 'insertMany');

      // Mock that an account already exists
      vi.spyOn(Account, 'countDocuments').mockResolvedValue(1);
      const accountCreateSpy = vi.spyOn(Account, 'create');

      const result = await seedUserDefaults(dummyUserId, 'EUR');

      expect(result.categoriesCreated).toBe(0);
      expect(result.accountCreated).toBe(false);
      expect(insertManySpy).not.toHaveBeenCalled();
      expect(accountCreateSpy).not.toHaveBeenCalled();
    });

    it('respects user custom currency for default account', async () => {
      vi.spyOn(Category, 'find').mockReturnValue({
        select: vi.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Category.find>);
      vi.spyOn(Category, 'insertMany').mockResolvedValue(
        [] as unknown as Awaited<ReturnType<typeof Category.insertMany>>
      );
      vi.spyOn(Account, 'countDocuments').mockResolvedValue(0);

      const accountCreateSpy = vi
        .spyOn(Account, 'create')
        .mockResolvedValue({} as unknown as Awaited<ReturnType<typeof Account.create>>);

      await seedUserDefaults(dummyUserId, 'bdt');

      expect(accountCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'BDT',
        })
      );
    });
  });
});
