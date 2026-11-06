// server/src/services/transactionService.ts

// Core transaction engine managing income, expense, transfers, balance reconciliation, and history queries.

import { Types } from 'mongoose';
import { Transaction, ITransaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { Category } from '../models/Category.js';
import { User } from '../models/User.js';
import { roundCurrency } from '../utils/mathUtils.js';
import { convertCurrency, getExchangeRates } from './ratesService.js';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionQueryParams,
} from '../schemas/transactionSchemas.js';
import { HttpError } from '../middlewares/errorHandler.js';

export interface PaginatedTransactions {
  transactions: ITransaction[];
  pagination: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Creates a transaction (income, expense, or transfer) and atomically reconciles account balance(s).
 */
export const createTransaction = async (
  userId: string,
  input: CreateTransactionInput
): Promise<ITransaction> => {
  const userObjectId = new Types.ObjectId(userId);
  const [user, ratesData] = await Promise.all([
    User.findById(userId).select('defaultCurrency').lean(),
    getExchangeRates(userId),
  ]);

  const defaultCurrency = user?.defaultCurrency || 'USD';
  const rates = ratesData.rates;

  if (input.type === 'transfer') {
    if (!input.destinationAccountId || input.destinationAccountId === input.accountId) {
      throw new HttpError('Transfers require distinct source and destination accounts', 400);
    }

    const [fromAccount, toAccount] = await Promise.all([
      Account.findOne({ _id: input.accountId, userId: userObjectId, isArchived: false }),
      Account.findOne({
        _id: input.destinationAccountId,
        userId: userObjectId,
        isArchived: false,
      }),
    ]);

    if (!fromAccount) throw new HttpError('Source account not found', 404);
    if (!toAccount) throw new HttpError('Destination account not found', 404);

    let destinationAmount: number;
    if (input.destinationAmount && input.destinationAmount > 0) {
      destinationAmount = roundCurrency(input.destinationAmount);
    } else if (fromAccount.currency === toAccount.currency) {
      destinationAmount = roundCurrency(input.amount);
    } else {
      destinationAmount = convertCurrency(
        input.amount,
        fromAccount.currency,
        toAccount.currency,
        rates
      );
    }

    let convertedAmount: number;
    try {
      convertedAmount = convertCurrency(input.amount, fromAccount.currency, defaultCurrency, rates);
    } catch {
      convertedAmount = input.amount;
    }

    fromAccount.balance = roundCurrency(fromAccount.balance - input.amount);
    toAccount.balance = roundCurrency(toAccount.balance + destinationAmount);

    const transaction = await Transaction.create({
      userId: userObjectId,
      accountId: fromAccount._id,
      type: 'transfer',
      amount: roundCurrency(input.amount),
      currency: fromAccount.currency,
      convertedAmount: roundCurrency(convertedAmount),
      destinationAccountId: toAccount._id,
      destinationAmount: roundCurrency(destinationAmount),
      destinationCurrency: toAccount.currency,
      date: input.date ? new Date(input.date) : new Date(),
      description: input.description,
      vendor: input.vendor || '',
      receiptUrl: input.receiptUrl || '',
      receiptOcrData: input.receiptOcrData || null,
    });

    await Promise.all([fromAccount.save(), toAccount.save()]);
    return transaction;
  }

  // Handle Income or Expense
  const account = await Account.findOne({
    _id: input.accountId,
    userId: userObjectId,
    isArchived: false,
  });

  if (!account) {
    throw new HttpError('Account not found or is archived', 404);
  }

  let categoryId: Types.ObjectId | undefined;
  if (input.categoryId) {
    const category = await Category.findOne({
      _id: input.categoryId,
      userId: userObjectId,
    });
    if (!category) {
      throw new HttpError('Category not found', 404);
    }
    categoryId = category._id;
  }

  const txCurrency = input.currency || account.currency;
  let convertedAmount: number;
  try {
    convertedAmount = convertCurrency(input.amount, txCurrency, defaultCurrency, rates);
  } catch {
    convertedAmount = input.amount;
  }

  // Update account balance
  if (input.type === 'income') {
    account.balance = roundCurrency(account.balance + input.amount);
  } else {
    account.balance = roundCurrency(account.balance - input.amount);
  }

  const transaction = await Transaction.create({
    userId: userObjectId,
    accountId: account._id,
    type: input.type,
    amount: roundCurrency(input.amount),
    currency: txCurrency,
    convertedAmount: roundCurrency(convertedAmount),
    categoryId,
    date: input.date ? new Date(input.date) : new Date(),
    description: input.description,
    vendor: input.vendor || '',
    receiptUrl: input.receiptUrl || '',
    receiptOcrData: input.receiptOcrData || null,
  });

  await account.save();
  return transaction;
};

/**
 * Reverses a transaction's prior balance impact on its affected accounts.
 */
const reverseBalanceImpact = async (
  userId: Types.ObjectId,
  transaction: ITransaction
): Promise<void> => {
  if (transaction.type === 'income') {
    const account = await Account.findOne({ _id: transaction.accountId, userId });
    if (account) {
      account.balance = roundCurrency(account.balance - transaction.amount);
      await account.save();
    }
  } else if (transaction.type === 'expense') {
    const account = await Account.findOne({ _id: transaction.accountId, userId });
    if (account) {
      account.balance = roundCurrency(account.balance + transaction.amount);
      await account.save();
    }
  } else if (transaction.type === 'transfer') {
    const [fromAccount, toAccount] = await Promise.all([
      Account.findOne({ _id: transaction.accountId, userId }),
      Account.findOne({ _id: transaction.destinationAccountId, userId }),
    ]);
    if (fromAccount) {
      fromAccount.balance = roundCurrency(fromAccount.balance + transaction.amount);
      await fromAccount.save();
    }
    if (toAccount) {
      const destAmount = transaction.destinationAmount || transaction.amount;
      toAccount.balance = roundCurrency(toAccount.balance - destAmount);
      await toAccount.save();
    }
  }
};

/**
 * Updates a transaction with atomic prior-balance reversal and new balance application.
 */
export const updateTransaction = async (
  userId: string,
  transactionId: string,
  input: UpdateTransactionInput
): Promise<ITransaction> => {
  const userObjectId = new Types.ObjectId(userId);
  const transaction = await Transaction.findOne({
    _id: new Types.ObjectId(transactionId),
    userId: userObjectId,
  });

  if (!transaction) {
    throw new HttpError('Transaction not found', 404);
  }

  // 1. Reverse old balance impact
  await reverseBalanceImpact(userObjectId, transaction);

  // 2. Resolve target configuration
  const targetType = input.type || transaction.type;
  const targetAccountId = input.accountId
    ? new Types.ObjectId(input.accountId)
    : transaction.accountId;
  const targetAmount = input.amount !== undefined ? input.amount : transaction.amount;

  const [user, ratesData] = await Promise.all([
    User.findById(userId).select('defaultCurrency').lean(),
    getExchangeRates(userId),
  ]);
  const defaultCurrency = user?.defaultCurrency || 'USD';
  const rates = ratesData.rates;

  // 3. Validate accounts and apply new balance impact
  if (targetType === 'transfer') {
    const targetDestAccountId = input.destinationAccountId
      ? new Types.ObjectId(input.destinationAccountId)
      : transaction.destinationAccountId;

    if (!targetDestAccountId || targetDestAccountId.equals(targetAccountId)) {
      throw new HttpError('Transfers require distinct source and destination accounts', 400);
    }

    const [fromAccount, toAccount] = await Promise.all([
      Account.findOne({ _id: targetAccountId, userId: userObjectId, isArchived: false }),
      Account.findOne({ _id: targetDestAccountId, userId: userObjectId, isArchived: false }),
    ]);

    if (!fromAccount) throw new HttpError('Source account not found', 404);
    if (!toAccount) throw new HttpError('Destination account not found', 404);

    let destinationAmount: number;
    if (input.destinationAmount && input.destinationAmount > 0) {
      destinationAmount = roundCurrency(input.destinationAmount);
    } else if (fromAccount.currency === toAccount.currency) {
      destinationAmount = roundCurrency(targetAmount);
    } else {
      destinationAmount = convertCurrency(
        targetAmount,
        fromAccount.currency,
        toAccount.currency,
        rates
      );
    }

    let convertedAmount: number;
    try {
      convertedAmount = convertCurrency(targetAmount, fromAccount.currency, defaultCurrency, rates);
    } catch {
      convertedAmount = targetAmount;
    }

    fromAccount.balance = roundCurrency(fromAccount.balance - targetAmount);
    toAccount.balance = roundCurrency(toAccount.balance + destinationAmount);

    await Promise.all([fromAccount.save(), toAccount.save()]);

    transaction.accountId = fromAccount._id;
    transaction.destinationAccountId = toAccount._id;
    transaction.type = 'transfer';
    transaction.amount = roundCurrency(targetAmount);
    transaction.currency = fromAccount.currency;
    transaction.convertedAmount = roundCurrency(convertedAmount);
    transaction.destinationAmount = roundCurrency(destinationAmount);
    transaction.destinationCurrency = toAccount.currency;
    transaction.categoryId = undefined;
  } else {
    // Income or Expense
    const account = await Account.findOne({
      _id: targetAccountId,
      userId: userObjectId,
      isArchived: false,
    });

    if (!account) {
      throw new HttpError('Account not found or is archived', 404);
    }

    if (input.categoryId !== undefined) {
      if (input.categoryId === null) {
        transaction.categoryId = undefined;
      } else {
        const category = await Category.findOne({
          _id: input.categoryId,
          userId: userObjectId,
        });
        if (!category) throw new HttpError('Category not found', 404);
        transaction.categoryId = category._id;
      }
    }

    const txCurrency = input.currency || transaction.currency || account.currency;
    let convertedAmount: number;
    try {
      convertedAmount = convertCurrency(targetAmount, txCurrency, defaultCurrency, rates);
    } catch {
      convertedAmount = targetAmount;
    }

    if (targetType === 'income') {
      account.balance = roundCurrency(account.balance + targetAmount);
    } else {
      account.balance = roundCurrency(account.balance - targetAmount);
    }

    await account.save();

    transaction.accountId = account._id;
    transaction.destinationAccountId = undefined;
    transaction.destinationAmount = undefined;
    transaction.destinationCurrency = undefined;
    transaction.type = targetType;
    transaction.amount = roundCurrency(targetAmount);
    transaction.currency = txCurrency;
    transaction.convertedAmount = roundCurrency(convertedAmount);
  }

  // Update optional metadata fields
  if (input.description !== undefined) transaction.description = input.description.trim();
  if (input.date !== undefined) transaction.date = new Date(input.date);
  if (input.vendor !== undefined) transaction.vendor = input.vendor.trim();
  if (input.receiptUrl !== undefined) transaction.receiptUrl = input.receiptUrl.trim();
  if (input.receiptOcrData !== undefined) transaction.receiptOcrData = input.receiptOcrData;

  await transaction.save();
  return transaction;
};

/**
 * Deletes a transaction and reverses its prior balance impact.
 */
export const deleteTransaction = async (userId: string, transactionId: string): Promise<void> => {
  const userObjectId = new Types.ObjectId(userId);
  const transaction = await Transaction.findOne({
    _id: new Types.ObjectId(transactionId),
    userId: userObjectId,
  });

  if (!transaction) {
    throw new HttpError('Transaction not found', 404);
  }

  await reverseBalanceImpact(userObjectId, transaction);
  await Transaction.deleteOne({ _id: transaction._id });
};

/**
 * Retrieves paginated, sorted, and filtered transaction history for a user.
 */
export const getTransactions = async (
  userId: string,
  query: TransactionQueryParams
): Promise<PaginatedTransactions> => {
  const userObjectId = new Types.ObjectId(userId);
  const filter: Record<string, unknown> = { userId: userObjectId };

  // Search by description or vendor
  if (query.search && query.search.trim().length > 0) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    filter.$or = [{ description: searchRegex }, { vendor: searchRegex }];
  }

  // Filter by transaction type
  if (query.type) {
    filter.type = query.type;
  }

  // Filter by account (matches either source or destination wallet)
  if (query.accountId) {
    const accountObjectId = new Types.ObjectId(query.accountId);
    filter.$or = [{ accountId: accountObjectId }, { destinationAccountId: accountObjectId }];
  }

  // Filter by category
  if (query.categoryId) {
    filter.categoryId = new Types.ObjectId(query.categoryId);
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (query.startDate) {
      dateFilter.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      // Set to end of day if only YYYY-MM-DD was provided
      const endDate = new Date(query.endDate);
      if (query.endDate.length === 10) {
        endDate.setHours(23, 59, 59, 999);
      }
      dateFilter.$lte = endDate;
    }
    filter.date = dateFilter;
  }

  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sortField = query.sortBy || 'date';
  const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

  const [transactions, totalCount] = await Promise.all([
    Transaction.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('accountId', 'name type currency color icon')
      .populate('destinationAccountId', 'name type currency color icon')
      .populate('categoryId', 'name type icon color')
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    transactions: transactions as unknown as ITransaction[],
    pagination: {
      totalCount,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    },
  };
};

/**
 * Retrieves a single transaction by ID.
 */
export const getTransactionById = async (
  userId: string,
  transactionId: string
): Promise<ITransaction> => {
  const transaction = await Transaction.findOne({
    _id: new Types.ObjectId(transactionId),
    userId: new Types.ObjectId(userId),
  })
    .populate('accountId', 'name type currency color icon')
    .populate('destinationAccountId', 'name type currency color icon')
    .populate('categoryId', 'name type icon color')
    .lean();

  if (!transaction) {
    throw new HttpError('Transaction not found', 404);
  }

  return transaction as unknown as ITransaction;
};
