// server/src/services/budgetService.ts

// Core budget engine computing category spending progress, remaining balances, and alert tiers.

import { Types } from 'mongoose';
import { Budget, IBudget } from '../models/Budget.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { roundCurrency } from '../utils/mathUtils.js';
import { convertCurrency, getExchangeRates } from './ratesService.js';
import { CreateBudgetInput, UpdateBudgetInput } from '../schemas/budgetSchemas.js';
import { HttpError } from '../middlewares/errorHandler.js';

export type AlertTier = 'normal' | 'warning' | 'exceeded';

export interface BudgetProgressItem {
  id: string;
  categoryId: {
    _id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
  };
  month: number;
  year: number;
  limitAmount: number;
  currency: string;
  spent: number;
  remaining: number;
  percentage: number;
  alertTier: AlertTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyBudgetProgress {
  budgets: BudgetProgressItem[];
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  overallPercentage: number;
  month: number;
  year: number;
}

/**
 * Returns all budgets for a given month/year with real-time calculated spending,
 * remaining balances, and overspending alert tiers.
 */
export const getBudgetsWithProgress = async (
  userId: string,
  targetMonth?: number,
  targetYear?: number
): Promise<MonthlyBudgetProgress> => {
  const userObjectId = new Types.ObjectId(userId);
  const now = new Date();
  const month = targetMonth || now.getUTCMonth() + 1;
  const year = targetYear || now.getUTCFullYear();

  const [user, ratesData, budgets] = await Promise.all([
    User.findById(userId).select('defaultCurrency').lean(),
    getExchangeRates(userId),
    Budget.find({ userId: userObjectId, month, year })
      .populate('categoryId', 'name icon color type')
      .lean(),
  ]);

  const defaultCurrency = user?.defaultCurrency || 'USD';
  const rates = ratesData.rates;

  // Month date range in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  // Find all expenses in this month
  const expenses = await Transaction.find({
    userId: userObjectId,
    type: 'expense',
    date: { $gte: startDate, $lt: endDate },
    categoryId: { $ne: null },
  })
    .select('categoryId amount currency convertedAmount')
    .lean();

  // Aggregate spending by category ID (in user's defaultCurrency)
  const spendByCategory = new Map<string, number>();
  let totalSpentInDefault = 0;

  for (const tx of expenses) {
    if (!tx.categoryId) continue;
    const catIdStr = tx.categoryId.toString();
    const amountInDefault =
      typeof tx.convertedAmount === 'number'
        ? tx.convertedAmount
        : convertCurrency(tx.amount, tx.currency, defaultCurrency, rates);

    spendByCategory.set(catIdStr, (spendByCategory.get(catIdStr) || 0) + amountInDefault);
    totalSpentInDefault += amountInDefault;
  }

  let totalBudgetedInDefault = 0;

  const budgetItems: BudgetProgressItem[] = budgets.map((b) => {
    const cat = b.categoryId as unknown as {
      _id: Types.ObjectId;
      name: string;
      icon: string;
      color: string;
      type: string;
    };
    const catIdStr = cat?._id?.toString() || b.categoryId.toString();
    const spentInDefault = spendByCategory.get(catIdStr) || 0;

    // Convert spent into the budget's defined currency if different from default
    const spentInBudgetCurrency =
      b.currency === defaultCurrency
        ? spentInDefault
        : convertCurrency(spentInDefault, defaultCurrency, b.currency, rates);

    const spent = roundCurrency(spentInBudgetCurrency);
    const limit = roundCurrency(b.limitAmount);
    const remaining = roundCurrency(limit - spent);
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    let alertTier: AlertTier = 'normal';
    if (percentage >= 100) {
      alertTier = 'exceeded';
    } else if (percentage >= 80) {
      alertTier = 'warning';
    }

    // Accumulate total budgeted in defaultCurrency
    const limitInDefault =
      b.currency === defaultCurrency
        ? limit
        : convertCurrency(limit, b.currency, defaultCurrency, rates);
    totalBudgetedInDefault += limitInDefault;

    return {
      id: b._id.toString(),
      categoryId: {
        _id: cat?._id?.toString() || catIdStr,
        name: cat?.name || 'Uncategorized',
        icon: cat?.icon || 'Folder',
        color: cat?.color || '#64748b',
        type: cat?.type || 'expense',
      },
      month: b.month,
      year: b.year,
      limitAmount: limit,
      currency: b.currency,
      spent,
      remaining,
      percentage,
      alertTier,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  });

  const roundedBudgeted = roundCurrency(totalBudgetedInDefault);
  const roundedSpent = roundCurrency(totalSpentInDefault);
  const roundedRemaining = roundCurrency(roundedBudgeted - roundedSpent);
  const overallPercentage =
    roundedBudgeted > 0 ? Math.round((roundedSpent / roundedBudgeted) * 100) : 0;

  return {
    budgets: budgetItems,
    totalBudgeted: roundedBudgeted,
    totalSpent: roundedSpent,
    remaining: roundedRemaining,
    overallPercentage,
    month,
    year,
  };
};

/**
 * Creates a category budget for a specified month and year.
 */
export const createBudget = async (userId: string, input: CreateBudgetInput): Promise<IBudget> => {
  const userObjectId = new Types.ObjectId(userId);
  const categoryObjectId = new Types.ObjectId(input.categoryId);

  const category = await Category.findOne({
    _id: categoryObjectId,
    userId: userObjectId,
  });
  if (!category) {
    throw new HttpError('Category not found', 404);
  }

  const existing = await Budget.findOne({
    userId: userObjectId,
    categoryId: categoryObjectId,
    month: input.month,
    year: input.year,
  });
  if (existing) {
    throw new HttpError(
      'A budget limit already exists for this category, month, and year',
      409
    );
  }

  const user = await User.findById(userId).select('defaultCurrency').lean();
  const currency = input.currency || user?.defaultCurrency || 'USD';

  const budget = await Budget.create({
    userId: userObjectId,
    categoryId: categoryObjectId,
    month: input.month,
    year: input.year,
    limitAmount: roundCurrency(input.limitAmount),
    currency,
  });

  return budget.populate('categoryId', 'name icon color type');
};

/**
 * Updates an existing category budget limit amount or currency.
 */
export const updateBudget = async (
  userId: string,
  budgetId: string,
  input: UpdateBudgetInput
): Promise<IBudget> => {
  if (!Types.ObjectId.isValid(budgetId)) {
    throw new HttpError('Invalid budget ID format', 400);
  }

  const budget = await Budget.findOne({
    _id: new Types.ObjectId(budgetId),
    userId: new Types.ObjectId(userId),
  });
  if (!budget) {
    throw new HttpError('Budget not found', 404);
  }

  if (input.limitAmount !== undefined) {
    budget.limitAmount = roundCurrency(input.limitAmount);
  }
  if (input.currency !== undefined) {
    budget.currency = input.currency.toUpperCase();
  }

  await budget.save();
  return budget.populate('categoryId', 'name icon color type');
};

/**
 * Deletes a category budget limit.
 */
export const deleteBudget = async (userId: string, budgetId: string): Promise<void> => {
  if (!Types.ObjectId.isValid(budgetId)) {
    throw new HttpError('Invalid budget ID format', 400);
  }

  const result = await Budget.deleteOne({
    _id: new Types.ObjectId(budgetId),
    userId: new Types.ObjectId(userId),
  });

  if (result.deletedCount === 0) {
    throw new HttpError('Budget not found', 404);
  }
};
