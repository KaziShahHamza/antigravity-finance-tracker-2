// server/src/services/dashboardService.ts

// Dashboard aggregation service providing financial KPIs, 6-month cash flow trends, category spend, and alerts.

import { Types } from 'mongoose';
import { Account } from '../models/Account.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { roundCurrency } from '../utils/mathUtils.js';
import { convertCurrency, getExchangeRates } from './ratesService.js';
import { getBudgetsWithProgress, BudgetProgressItem } from './budgetService.js';

export interface CashFlowPoint {
  month: string;
  year: number;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdownPoint {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netSavings: number;
  savingsRate: number;
  currency: string;
  cashFlowSeries: CashFlowPoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
  recentTransactions: unknown[];
  budgetAlerts: {
    warningCount: number;
    exceededCount: number;
    items: BudgetProgressItem[];
  };
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Computes the unified dashboard summary for the authenticated user in their defaultCurrency.
 */
export const getDashboardSummary = async (userId: string): Promise<DashboardSummary> => {
  const userObjectId = new Types.ObjectId(userId);
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth(); // 0-indexed (0 = Jan)

  const [user, ratesData, accounts] = await Promise.all([
    User.findById(userId).select('defaultCurrency').lean(),
    getExchangeRates(userId),
    Account.find({ userId: userObjectId, isArchived: false }).lean(),
  ]);

  const defaultCurrency = user?.defaultCurrency || 'USD';
  const rates = ratesData.rates;

  // 1. Calculate Total Balance across all non-archived wallets converted to defaultCurrency
  let totalBalance = 0;
  for (const acc of accounts) {
    const converted =
      acc.currency === defaultCurrency
        ? acc.balance
        : convertCurrency(acc.balance, acc.currency, defaultCurrency, rates);
    totalBalance += converted;
  }
  totalBalance = roundCurrency(totalBalance);

  // 2. Compute 6-month date range (5 months prior + current month)
  // E.g., for Month 11 (Nov): Jun, Jul, Aug, Sep, Oct, Nov
  const seriesMonths: { monthIndex: number; year: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    while (m < 0) {
      m += 12;
      y -= 1;
    }
    seriesMonths.push({ monthIndex: m, year: y });
  }

  const earliestMonth = seriesMonths[0];
  const startDate = new Date(Date.UTC(earliestMonth.year, earliestMonth.monthIndex, 1, 0, 0, 0, 0));

  // Fetch all transactions in the 6-month window
  const transactions = await Transaction.find({
    userId: userObjectId,
    date: { $gte: startDate },
  })
    .sort({ date: -1 })
    .lean();

  // 3. Aggregate 6-month Cash Flow
  const monthlyAggregations = new Map<string, { income: number; expense: number }>();
  for (const sm of seriesMonths) {
    const key = `${sm.year}-${sm.monthIndex}`;
    monthlyAggregations.set(key, { income: 0, expense: 0 });
  }

  // Current month bounds for KPIs
  const currentMonthKey = `${currentYear}-${currentMonth}`;
  const currentMonthExpensesByCategory = new Map<string, number>();

  for (const tx of transactions) {
    const txDate = new Date(tx.date);
    const txYear = txDate.getUTCFullYear();
    const txMonth = txDate.getUTCMonth();
    const key = `${txYear}-${txMonth}`;

    const convertedAmt =
      typeof tx.convertedAmount === 'number'
        ? tx.convertedAmount
        : convertCurrency(tx.amount, tx.currency, defaultCurrency, rates);

    const agg = monthlyAggregations.get(key);
    if (agg) {
      if (tx.type === 'income') {
        agg.income += convertedAmt;
      } else if (tx.type === 'expense') {
        agg.expense += convertedAmt;
      }
    }

    if (key === currentMonthKey && tx.type === 'expense' && tx.categoryId) {
      const catIdStr = tx.categoryId.toString();
      currentMonthExpensesByCategory.set(
        catIdStr,
        (currentMonthExpensesByCategory.get(catIdStr) || 0) + convertedAmt
      );
    }
  }

  const cashFlowSeries: CashFlowPoint[] = seriesMonths.map((sm) => {
    const key = `${sm.year}-${sm.monthIndex}`;
    const agg = monthlyAggregations.get(key) || { income: 0, expense: 0 };
    const income = roundCurrency(agg.income);
    const expense = roundCurrency(agg.expense);
    const net = roundCurrency(income - expense);
    return {
      month: SHORT_MONTHS[sm.monthIndex],
      year: sm.year,
      income,
      expense,
      net,
    };
  });

  // Current Month KPIs
  const currentMonthAgg = monthlyAggregations.get(currentMonthKey) || { income: 0, expense: 0 };
  const monthlyIncome = roundCurrency(currentMonthAgg.income);
  const monthlyExpenses = roundCurrency(currentMonthAgg.expense);
  const netSavings = roundCurrency(monthlyIncome - monthlyExpenses);
  const savingsRate =
    monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0;

  // 4. Category Breakdown for current month
  const categoryIds = Array.from(currentMonthExpensesByCategory.keys()).map(
    (id) => new Types.ObjectId(id)
  );
  const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
  const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]));

  const totalCurrentMonthExpense = monthlyExpenses;
  const breakdownList: CategoryBreakdownPoint[] = [];

  for (const [catId, amount] of currentMonthExpensesByCategory.entries()) {
    const cat = categoryMap.get(catId);
    const roundedAmt = roundCurrency(amount);
    const pct =
      totalCurrentMonthExpense > 0 ? Math.round((roundedAmt / totalCurrentMonthExpense) * 100) : 0;
    breakdownList.push({
      categoryId: catId,
      name: cat?.name || 'Uncategorized',
      color: cat?.color || '#94a3b8',
      icon: cat?.icon || 'Folder',
      amount: roundedAmt,
      percentage: pct,
    });
  }

  breakdownList.sort((a, b) => b.amount - a.amount);

  // 5. Recent 5 Transactions with populated category and account
  const recentTransactions = await Transaction.find({ userId: userObjectId })
    .sort({ date: -1, createdAt: -1 })
    .limit(5)
    .populate('accountId', 'name type currency icon color')
    .populate('destinationAccountId', 'name type currency icon color')
    .populate('categoryId', 'name icon color type')
    .lean();

  // 6. Budget Alerts for current month
  const budgetProgress = await getBudgetsWithProgress(userId, currentMonth + 1, currentYear);

  const alertItems = budgetProgress.budgets.filter(
    (b) => b.alertTier === 'warning' || b.alertTier === 'exceeded'
  );
  const warningCount = alertItems.filter((b) => b.alertTier === 'warning').length;
  const exceededCount = alertItems.filter((b) => b.alertTier === 'exceeded').length;

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    netSavings,
    savingsRate,
    currency: defaultCurrency,
    cashFlowSeries,
    categoryBreakdown: breakdownList,
    recentTransactions,
    budgetAlerts: {
      warningCount,
      exceededCount,
      items: alertItems,
    },
  };
};
