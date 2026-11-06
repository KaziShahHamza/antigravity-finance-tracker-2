// server/src/services/accountService.ts

// Service managing wallet accounts CRUD, multi-currency balance aggregation, and soft/hard deletion logic.

import { Account, IAccount } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { roundCurrency, sumCurrency } from '../utils/mathUtils.js';
import { convertCurrency, getExchangeRates } from './ratesService.js';
import { CreateAccountInput, UpdateAccountInput } from '../schemas/accountSchemas.js';
import { HttpError } from '../middlewares/errorHandler.js';

export interface AccountWithConvertedBalance {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  convertedBalance: number;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountsSummary {
  accounts: AccountWithConvertedBalance[];
  totalBalance: number;
  currency: string;
}

/**
 * Retrieves all non-archived accounts for a user with converted balances and total aggregate balance.
 */
export const getUserAccounts = async (
  userId: string,
  includeArchived: boolean = false
): Promise<AccountsSummary> => {
  const query: Record<string, unknown> = { userId };
  if (!includeArchived) {
    query.isArchived = false;
  }

  const [accounts, user, ratesData] = await Promise.all([
    Account.find(query).sort({ createdAt: -1 }).lean(),
    User.findById(userId).select('defaultCurrency').lean(),
    getExchangeRates(userId),
  ]);

  const defaultCurrency = user?.defaultCurrency || 'USD';
  const rates = ratesData.rates;

  const accountsWithConverted: AccountWithConvertedBalance[] = accounts.map((acc) => {
    let convertedBalance = acc.balance;
    try {
      convertedBalance = convertCurrency(acc.balance, acc.currency, defaultCurrency, rates);
    } catch {
      convertedBalance = acc.balance;
    }

    return {
      id: acc._id.toString(),
      name: acc.name,
      type: acc.type,
      balance: roundCurrency(acc.balance),
      currency: acc.currency,
      convertedBalance: roundCurrency(convertedBalance),
      color: acc.color,
      icon: acc.icon,
      isArchived: acc.isArchived,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt,
    };
  });

  // Calculate total balance: non-credit accounts are assets, credit cards count as liability if positive
  const balances = accountsWithConverted.map((acc) => {
    if (acc.type === 'credit') {
      return -Math.abs(acc.convertedBalance);
    }
    return acc.convertedBalance;
  });

  const totalBalance = sumCurrency(balances);

  return {
    accounts: accountsWithConverted,
    totalBalance,
    currency: defaultCurrency,
  };
};

/**
 * Retrieves a single account ensuring user ownership.
 */
export const getAccountById = async (userId: string, accountId: string): Promise<IAccount> => {
  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) {
    throw new HttpError('Account not found', 404);
  }
  return account;
};

/**
 * Creates a new account/wallet for a user.
 */
export const createAccount = async (
  userId: string,
  data: CreateAccountInput
): Promise<IAccount> => {
  const account = await Account.create({
    userId,
    name: data.name.trim(),
    type: data.type,
    balance: roundCurrency(data.balance || 0),
    currency: data.currency.toUpperCase().trim(),
    color: data.color || '#10b981',
    icon: data.icon || 'Wallet',
    isArchived: false,
  });

  return account;
};

/**
 * Updates an existing account's details.
 */
export const updateAccount = async (
  userId: string,
  accountId: string,
  data: UpdateAccountInput
): Promise<IAccount> => {
  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) {
    throw new HttpError('Account not found', 404);
  }

  if (data.name !== undefined) account.name = data.name.trim();
  if (data.type !== undefined) account.type = data.type;
  if (data.balance !== undefined) account.balance = roundCurrency(data.balance);
  if (data.currency !== undefined) account.currency = data.currency.toUpperCase().trim();
  if (data.color !== undefined) account.color = data.color.trim();
  if (data.icon !== undefined) account.icon = data.icon.trim();
  if (data.isArchived !== undefined) account.isArchived = data.isArchived;

  await account.save();
  return account;
};

/**
 * Deletes or archives an account. If transactions exist, it is soft-archived to maintain financial history.
 */
export const deleteAccount = async (
  userId: string,
  accountId: string
): Promise<{ message: string; archived: boolean }> => {
  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) {
    throw new HttpError('Account not found', 404);
  }

  // Check if transactions exist referencing this account (either as source or destination)
  const transactionCount = await Transaction.countDocuments({
    userId,
    $or: [{ accountId }, { destinationAccountId: accountId }],
  });

  if (transactionCount > 0) {
    account.isArchived = true;
    await account.save();
    return {
      message: 'Account has associated transaction history and was archived successfully.',
      archived: true,
    };
  }

  await Account.findByIdAndDelete(accountId);
  return {
    message: 'Account deleted successfully.',
    archived: false,
  };
};
