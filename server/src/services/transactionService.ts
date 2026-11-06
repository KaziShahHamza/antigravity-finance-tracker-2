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
import {
  reverseBalanceImpact,
  executeTransferImpact,
  applyAccountBalanceImpact,
} from './balanceReconciler.js';
import { buildTransactionQuery, PaginatedTransactions } from './transactionQueryBuilder.js';
export type { PaginatedTransactions };

const resolveCategory = async (
  userId: Types.ObjectId,
  categoryId?: string | null
): Promise<Types.ObjectId | undefined> => {
  if (!categoryId) return undefined;
  const category = await Category.findOne({ _id: categoryId, userId });
  if (!category) throw new HttpError('Category not found', 404);
  return category._id;
};

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

    const { fromAccount, toAccount, destinationAmount, convertedAmount } =
      await executeTransferImpact(
        userObjectId,
        new Types.ObjectId(input.accountId),
        new Types.ObjectId(input.destinationAccountId),
        input.amount,
        input.destinationAmount,
        rates,
        defaultCurrency
      );

    return Transaction.create({
      userId: userObjectId,
      accountId: fromAccount._id,
      type: 'transfer',
      amount: roundCurrency(input.amount),
      currency: fromAccount.currency,
      convertedAmount,
      destinationAccountId: toAccount._id,
      destinationAmount,
      destinationCurrency: toAccount.currency,
      date: input.date ? new Date(input.date) : new Date(),
      description: input.description,
      vendor: input.vendor || '',
      receiptUrl: input.receiptUrl || '',
      receiptOcrData: input.receiptOcrData || null,
    });
  }

  const account = await Account.findOne({
    _id: input.accountId,
    userId: userObjectId,
    isArchived: false,
  });
  if (!account) throw new HttpError('Account not found or is archived', 404);

  const categoryId = await resolveCategory(userObjectId, input.categoryId);
  const txCurrency = input.currency || account.currency;
  let convertedAmount: number;
  try {
    convertedAmount = convertCurrency(input.amount, txCurrency, defaultCurrency, rates);
  } catch {
    convertedAmount = input.amount;
  }

  applyAccountBalanceImpact(account, input.amount, input.type);

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

  if (!transaction) throw new HttpError('Transaction not found', 404);

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

    const { fromAccount, toAccount, destinationAmount, convertedAmount } =
      await executeTransferImpact(
        userObjectId,
        targetAccountId,
        targetDestAccountId,
        targetAmount,
        input.destinationAmount,
        rates,
        defaultCurrency
      );

    transaction.accountId = fromAccount._id;
    transaction.destinationAccountId = toAccount._id;
    transaction.type = 'transfer';
    transaction.amount = roundCurrency(targetAmount);
    transaction.currency = fromAccount.currency;
    transaction.convertedAmount = destinationAmount ? convertedAmount : roundCurrency(targetAmount);
    transaction.destinationAmount = destinationAmount;
    transaction.destinationCurrency = toAccount.currency;
    transaction.categoryId = undefined;
  } else {
    const account = await Account.findOne({
      _id: targetAccountId,
      userId: userObjectId,
      isArchived: false,
    });
    if (!account) throw new HttpError('Account not found or is archived', 404);

    if (input.categoryId !== undefined) {
      transaction.categoryId = await resolveCategory(userObjectId, input.categoryId);
    }

    const txCurrency = input.currency || transaction.currency || account.currency;
    let convertedAmount: number;
    try {
      convertedAmount = convertCurrency(targetAmount, txCurrency, defaultCurrency, rates);
    } catch {
      convertedAmount = targetAmount;
    }

    applyAccountBalanceImpact(account, targetAmount, targetType);
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

  if (!transaction) throw new HttpError('Transaction not found', 404);

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
  const { filter, sort, skip, limit, page } = buildTransactionQuery(userId, query);

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

  if (!transaction) throw new HttpError('Transaction not found', 404);

  return transaction as unknown as ITransaction;
};
