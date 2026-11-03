// server/src/services/seedService.ts

// Service for idempotently seeding 12 default categories and the initial Main Checking account.

import { Types } from 'mongoose';
import { Category, CategoryType } from '../models/Category.js';
import { Account, IAccount } from '../models/Account.js';

export interface DefaultCategoryDefinition {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: ReadonlyArray<DefaultCategoryDefinition> = [
  // Expense categories
  { name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#f97316' },
  { name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#6366f1' },
  { name: 'Groceries', type: 'expense', icon: 'ShoppingBag', color: '#10b981' },
  { name: 'Shopping', type: 'expense', icon: 'Shirt', color: '#ec4899' },
  { name: 'Transportation', type: 'expense', icon: 'Car', color: '#3b82f6' },
  { name: 'Utilities', type: 'expense', icon: 'Zap', color: '#eab308' },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8b5cf6' },
  { name: 'Health', type: 'expense', icon: 'HeartPulse', color: '#ef4444' },
  { name: 'Other', type: 'expense', icon: 'MoreHorizontal', color: '#64748b' },

  // Income categories
  { name: 'Salary', type: 'income', icon: 'Briefcase', color: '#22c55e' },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: '#06b6d4' },
  { name: 'Investment', type: 'income', icon: 'TrendingUp', color: '#14b8a6' },
];

export interface SeedResult {
  categoriesCreated: number;
  accountCreated: boolean;
  account?: IAccount;
}

/**
 * Idempotently seeds default categories and a primary checking account for a verified user.
 */
export const seedUserDefaults = async (
  userId: string | Types.ObjectId,
  defaultCurrency: string = 'USD'
): Promise<SeedResult> => {
  const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

  // 1. Seed Categories idempotently
  const existingCategories = await Category.find({ userId: userObjectId }).select('name');
  const existingNames = new Set(existingCategories.map((c) => c.name.toLowerCase()));

  const categoriesToInsert = DEFAULT_CATEGORIES.filter(
    (def) => !existingNames.has(def.name.toLowerCase())
  ).map((def) => ({
    userId: userObjectId,
    name: def.name,
    type: def.type,
    icon: def.icon,
    color: def.color,
    isDefault: true,
  }));

  let categoriesCreated = 0;
  if (categoriesToInsert.length > 0) {
    const inserted = await Category.insertMany(categoriesToInsert);
    categoriesCreated = inserted.length;
  }

  // 2. Seed Default Account ('Main Checking') idempotently
  const existingAccountsCount = await Account.countDocuments({ userId: userObjectId });
  let accountCreated = false;
  let account: IAccount | undefined;

  if (existingAccountsCount === 0) {
    account = await Account.create({
      userId: userObjectId,
      name: 'Main Checking',
      type: 'bank',
      balance: 0,
      currency: defaultCurrency.toUpperCase().trim(),
      color: '#10b981',
      icon: 'Landmark',
      isArchived: false,
    });
    accountCreated = true;
  }

  return {
    categoriesCreated,
    accountCreated,
    account,
  };
};
