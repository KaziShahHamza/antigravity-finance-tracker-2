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
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  convertedAmount: number;
  destinationAccountId?: string;
  destinationAmount?: number;
  destinationCurrency?: string;
  categoryId?: string;
  date: string;
  description: string;
  vendor?: string;
  receiptUrl?: string;
  receiptOcrData?: Record<string, unknown>;
  isDemo?: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: number;
  year: number;
  limitAmount: number;
  currency: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
}
