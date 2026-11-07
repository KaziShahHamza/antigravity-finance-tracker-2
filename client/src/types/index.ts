// client/src/types/index.ts

// Core TypeScript interfaces and domain types shared across the client application.

export type WalletType = 'cash' | 'bank' | 'bkash' | 'nagad' | 'credit' | 'other';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isVerified: boolean;
  defaultCurrency: string;
  monthlyBudgetLimit?: number;
  customExchangeRates?: Record<string, number>;
  themePreference: ThemePreference;
}

export interface Account {
  id: string;
  _id?: string;
  name: string;
  type: WalletType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  isArchived: boolean;
}

export interface Category {
  id: string;
  _id?: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface PopulatedAccount {
  _id?: string;
  id?: string;
  name: string;
  type: WalletType;
  currency: string;
  color?: string;
  icon?: string;
}

export interface PopulatedCategory {
  _id?: string;
  id?: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export interface Transaction {
  _id?: string;
  id?: string;
  accountId: string | PopulatedAccount;
  type: TransactionType;
  amount: number;
  currency: string;
  convertedAmount: number;
  destinationAccountId?: string | PopulatedAccount;
  destinationAmount?: number;
  destinationCurrency?: string;
  categoryId?: string | PopulatedCategory;
  date: string;
  description: string;
  vendor?: string;
  receiptUrl?: string;
  receiptOcrData?: Record<string, unknown>;
  isDemo?: boolean;
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface ReceiptOcrResult {
  vendor: string;
  date: string;
  totalAmount: number;
  currency: string;
  suggestedCategory: string;
  items: ReceiptItem[];
  receiptUrl: string;
  isMock?: boolean;
}

export interface PaginationMeta {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface TransactionFilterParams {
  search?: string;
  type?: TransactionType | '';
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'amount' | 'convertedAmount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface Budget {
  id: string;
  _id?: string;
  categoryId: string | PopulatedCategory;
  month: number;
  year: number;
  limitAmount: number;
  currency: string;
}

export type AlertTier = 'normal' | 'warning' | 'exceeded';

export interface BudgetProgressItem {
  id: string;
  _id?: string;
  categoryId: PopulatedCategory;
  month: number;
  year: number;
  limitAmount: number;
  currency: string;
  spent: number;
  remaining: number;
  percentage: number;
  alertTier: AlertTier;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthlyBudgetsData {
  budgets: BudgetProgressItem[];
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  overallPercentage: number;
  month: number;
  year: number;
}

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
  recentTransactions: Transaction[];
  budgetAlerts: {
    warningCount: number;
    exceededCount: number;
    items: BudgetProgressItem[];
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  email: string;
}
