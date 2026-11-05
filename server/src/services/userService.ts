// server/src/services/userService.ts

// Service layer handling user profile retrieval, profile updates, password changes, and demo data seeding.

import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { Account } from '../models/Account.js';
import { Budget } from '../models/Budget.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { IUser, User } from '../models/User.js';
import type { UpdatePasswordInput, UpdateProfileInput } from '../schemas/userSchemas.js';
import { seedUserDefaults } from './seedService.js';

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isVerified: boolean;
  defaultCurrency: string;
  monthlyBudgetLimit?: number | null;
  customExchangeRates: Record<string, number>;
  themePreference: string;
  createdAt: Date;
}

export interface DemoDataResult {
  accountsCreated: number;
  budgetsCreated: number;
  transactionsCreated: number;
}

const mapUserToProfile = (user: IUser): UserProfileResponse => {
  const ratesObj: Record<string, number> = {};
  if (user.customExchangeRates instanceof Map) {
    user.customExchangeRates.forEach((val, key) => {
      ratesObj[key] = val;
    });
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    isVerified: user.isVerified,
    defaultCurrency: user.defaultCurrency,
    monthlyBudgetLimit: user.monthlyBudgetLimit ?? null,
    customExchangeRates: ratesObj,
    themePreference: user.themePreference,
    createdAt: user.createdAt,
  };
};

export const getUserProfile = async (userId: string): Promise<UserProfileResponse> => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as { code?: string; statusCode?: number }).code = 'USER_NOT_FOUND';
    (error as { code?: string; statusCode?: number }).statusCode = 404;
    throw error;
  }

  return mapUserToProfile(user);
};

export const updateUserProfile = async (
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfileResponse> => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as { code?: string; statusCode?: number }).code = 'USER_NOT_FOUND';
    (error as { code?: string; statusCode?: number }).statusCode = 404;
    throw error;
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.defaultCurrency !== undefined) user.defaultCurrency = input.defaultCurrency;
  if (input.monthlyBudgetLimit !== undefined)
    user.monthlyBudgetLimit = input.monthlyBudgetLimit ?? undefined;
  if (input.themePreference !== undefined) user.themePreference = input.themePreference;

  if (input.customExchangeRates !== undefined) {
    user.customExchangeRates = new Map(Object.entries(input.customExchangeRates));
  }

  await user.save();
  return mapUserToProfile(user);
};

export const changeUserPassword = async (
  userId: string,
  input: UpdatePasswordInput
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as { code?: string; statusCode?: number }).code = 'USER_NOT_FOUND';
    (error as { code?: string; statusCode?: number }).statusCode = 404;
    throw error;
  }

  if (!user.password) {
    const error = new Error(
      'Account was created via social authentication and does not have an existing password.'
    );
    (error as { code?: string; statusCode?: number }).code = 'PASSWORD_NOT_SET';
    (error as { code?: string; statusCode?: number }).statusCode = 400;
    throw error;
  }

  const isCurrentValid = await bcrypt.compare(input.currentPassword, user.password);
  if (!isCurrentValid) {
    const error = new Error('The current password provided is incorrect.');
    (error as { code?: string; statusCode?: number }).code = 'INVALID_CURRENT_PASSWORD';
    (error as { code?: string; statusCode?: number }).statusCode = 400;
    throw error;
  }

  user.password = await bcrypt.hash(input.newPassword, 10);
  user.refreshTokenHash = undefined; // Revoke all active sessions upon password change
  await user.save();
};

export const seedDemoData = async (userId: string): Promise<DemoDataResult> => {
  const userObjectId = new Types.ObjectId(userId);
  const user = await User.findById(userObjectId);
  if (!user) {
    const error = new Error('User not found');
    (error as { code?: string; statusCode?: number }).code = 'USER_NOT_FOUND';
    (error as { code?: string; statusCode?: number }).statusCode = 404;
    throw error;
  }

  // Ensure default categories exist
  await seedUserDefaults(userObjectId, user.defaultCurrency);
  const categories = await Category.find({
    $or: [{ userId: userObjectId }, { isDefault: true }],
  });
  const catMap = new Map<string, Types.ObjectId>();
  categories.forEach((c) => catMap.set(c.name.toLowerCase(), c._id as Types.ObjectId));

  const curr = user.defaultCurrency;

  // 1. Seed demo accounts
  const demoAccountsData = [
    {
      userId: userObjectId,
      name: 'Main Checking',
      type: 'bank' as const,
      balance: 4850,
      currency: curr,
      color: '#3b82f6',
      icon: 'Building2',
      isArchived: false,
    },
    {
      userId: userObjectId,
      name: 'Cash Wallet',
      type: 'cash' as const,
      balance: 320,
      currency: curr,
      color: '#10b981',
      icon: 'Banknote',
      isArchived: false,
    },
    {
      userId: userObjectId,
      name: 'bKash Wallet',
      type: 'bkash' as const,
      balance: 14500,
      currency: 'BDT',
      color: '#ec4899',
      icon: 'Smartphone',
      isArchived: false,
    },
    {
      userId: userObjectId,
      name: 'Credit Card',
      type: 'credit' as const,
      balance: -420,
      currency: curr,
      color: '#f43f5e',
      icon: 'CreditCard',
      isArchived: false,
    },
  ];

  const createdAccounts = await Account.insertMany(demoAccountsData);
  const bankAcc = createdAccounts[0];
  const cashAcc = createdAccounts[1];
  const bkashAcc = createdAccounts[2];
  const cardAcc = createdAccounts[3];

  // 2. Seed demo monthly budgets
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const demoBudgetsData = [
    { name: 'groceries', amount: 500 },
    { name: 'food & dining', amount: 350 },
    { name: 'utilities', amount: 200 },
    { name: 'entertainment', amount: 150 },
  ]
    .filter((b) => catMap.has(b.name))
    .map((b) => ({
      userId: userObjectId,
      categoryId: catMap.get(b.name)!,
      month: currentMonth,
      year: currentYear,
      limitAmount: b.amount,
      currency: curr,
    }));

  const createdBudgets = await Budget.insertMany(demoBudgetsData);

  // 3. Seed demo transactions (spread over past 30 days)
  const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  const demoTransactionsData = [
    {
      userId: userObjectId,
      accountId: bankAcc._id,
      type: 'income' as const,
      amount: 3500,
      currency: curr,
      convertedAmount: 3500,
      categoryId: catMap.get('salary'),
      date: daysAgo(28),
      description: 'Monthly Salary Deposit',
      vendor: 'TechCorp International',
      isDemo: true,
    },
    {
      userId: userObjectId,
      accountId: bankAcc._id,
      type: 'income' as const,
      amount: 750,
      currency: curr,
      convertedAmount: 750,
      categoryId: catMap.get('freelance'),
      date: daysAgo(14),
      description: 'Web Design Project Milestone',
      vendor: 'Acme Studio',
      isDemo: true,
    },
    {
      userId: userObjectId,
      accountId: bankAcc._id,
      type: 'expense' as const,
      amount: 142.5,
      currency: curr,
      convertedAmount: 142.5,
      categoryId: catMap.get('groceries'),
      date: daysAgo(22),
      description: 'Weekly Organic Groceries',
      vendor: 'Whole Foods Market',
      isDemo: true,
    },
    {
      userId: userObjectId,
      accountId: cardAcc._id,
      type: 'expense' as const,
      amount: 68.4,
      currency: curr,
      convertedAmount: 68.4,
      categoryId: catMap.get('food & dining'),
      date: daysAgo(19),
      description: 'Dinner with colleagues',
      vendor: 'Trattoria Bella',
      isDemo: true,
    },
    {
      userId: userObjectId,
      accountId: cashAcc._id,
      type: 'expense' as const,
      amount: 15.0,
      currency: curr,
      convertedAmount: 15.0,
      categoryId: catMap.get('food & dining'),
      date: daysAgo(18),
      description: 'Artisan Coffee and Pastry',
      vendor: 'Blue Bottle Cafe',
      isDemo: true,
    },
    {
      userId: userObjectId,
      accountId: bankAcc._id,
      type: 'expense' as const,
      amount: 120.0,
      currency: curr,
      convertedAmount: 120.0,
      categoryId: catMap.get('utilities'),
      date: daysAgo(15),
      description: 'Electricity & High-speed Internet',
      vendor: 'Metro Power Utility',
      isDemo: true,
    },
    {
      userId: userObjectId,
      accountId: cardAcc._id,
      type: 'expense' as const,
      amount: 19.99,
      currency: curr,
      convertedAmount: 19.99,
      categoryId: catMap.get('entertainment'),
      date: daysAgo(12),
      description: 'Monthly 4K Family Streaming',
      vendor: 'Netflix Inc',
      isDemo: true,
    },
    {
      userId: userObjectId,
      accountId: cashAcc._id,
      type: 'expense' as const,
      amount: 30.0,
      currency: curr,
      convertedAmount: 30.0,
      categoryId: catMap.get('transportation'),
      date: daysAgo(10),
      description: 'Subway & Bus Transit Card Reload',
      vendor: 'City Transit Authority',
      isDemo: true,
    },
    {
      userId: userObjectId,
      accountId: cardAcc._id,
      type: 'expense' as const,
      amount: 55.0,
      currency: curr,
      convertedAmount: 55.0,
      categoryId: catMap.get('health'),
      date: daysAgo(8),
      description: 'Vitamins and First Aid Supplies',
      vendor: 'CVS Pharmacy',
      isDemo: true,
    },
    {
      userId: userObjectId,
      accountId: bkashAcc._id,
      type: 'expense' as const,
      amount: 650,
      currency: 'BDT',
      convertedAmount: 5.42,
      categoryId: catMap.get('utilities'),
      date: daysAgo(5),
      description: 'Fiber Internet Monthly Subscription',
      vendor: 'Dot Internet BDT',
      isDemo: true,
    },
    {
      userId: userObjectId,
      accountId: bankAcc._id,
      type: 'transfer' as const,
      amount: 200,
      currency: curr,
      convertedAmount: 200,
      destinationAccountId: cashAcc._id,
      destinationAmount: 200,
      destinationCurrency: curr,
      date: daysAgo(4),
      description: 'ATM Cash Withdrawal',
      vendor: 'Central Bank ATM',
      isDemo: true,
    },
    {
      userId: userObjectId,
      accountId: cardAcc._id,
      type: 'expense' as const,
      amount: 88.5,
      currency: curr,
      convertedAmount: 88.5,
      categoryId: catMap.get('shopping'),
      date: daysAgo(2),
      description: 'Ergonomic Desk Accessories',
      vendor: 'Amazon Marketplace',
      isDemo: true,
    },
  ];

  const createdTransactions = await Transaction.insertMany(demoTransactionsData);

  return {
    accountsCreated: createdAccounts.length,
    budgetsCreated: createdBudgets.length,
    transactionsCreated: createdTransactions.length,
  };
};
