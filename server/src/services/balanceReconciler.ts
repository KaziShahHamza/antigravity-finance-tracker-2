// server/src/services/balanceReconciler.ts

// Reconciles and reverses account balances affected by income, expense, and transfer transactions.

import { Types } from 'mongoose';
import { Account, IAccount } from '../models/Account.js';
import { ITransaction } from '../models/Transaction.js';
import { roundCurrency } from '../utils/mathUtils.js';
import { convertCurrency } from './ratesService.js';
import { HttpError } from '../middlewares/errorHandler.js';

/**
 * Reverses a transaction's prior balance impact on its affected accounts.
 */
export const reverseBalanceImpact = async (
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
 * Applies balance impact for single-account income or expense transactions.
 */
export const applyAccountBalanceImpact = (
  account: IAccount,
  amount: number,
  type: 'income' | 'expense'
): void => {
  if (type === 'income') {
    account.balance = roundCurrency(account.balance + amount);
  } else {
    account.balance = roundCurrency(account.balance - amount);
  }
};

export interface TransferImpactResult {
  fromAccount: IAccount;
  toAccount: IAccount;
  destinationAmount: number;
  convertedAmount: number;
}

/**
 * Calculates conversion, adjusts balances, and saves both source and destination accounts.
 */
export const executeTransferImpact = async (
  userObjectId: Types.ObjectId,
  fromAccountId: Types.ObjectId,
  toAccountId: Types.ObjectId,
  amount: number,
  customDestinationAmount: number | undefined,
  rates: Record<string, number>,
  defaultCurrency: string
): Promise<TransferImpactResult> => {
  const [fromAccount, toAccount] = await Promise.all([
    Account.findOne({ _id: fromAccountId, userId: userObjectId, isArchived: false }),
    Account.findOne({ _id: toAccountId, userId: userObjectId, isArchived: false }),
  ]);

  if (!fromAccount) throw new HttpError('Source account not found', 404);
  if (!toAccount) throw new HttpError('Destination account not found', 404);

  let destinationAmount: number;
  if (customDestinationAmount && customDestinationAmount > 0) {
    destinationAmount = roundCurrency(customDestinationAmount);
  } else if (fromAccount.currency === toAccount.currency) {
    destinationAmount = roundCurrency(amount);
  } else {
    destinationAmount = convertCurrency(amount, fromAccount.currency, toAccount.currency, rates);
  }

  let convertedAmount: number;
  try {
    convertedAmount = convertCurrency(amount, fromAccount.currency, defaultCurrency, rates);
  } catch {
    convertedAmount = amount;
  }

  fromAccount.balance = roundCurrency(fromAccount.balance - amount);
  toAccount.balance = roundCurrency(toAccount.balance + destinationAmount);

  await Promise.all([fromAccount.save(), toAccount.save()]);

  return {
    fromAccount,
    toAccount,
    destinationAmount: roundCurrency(destinationAmount),
    convertedAmount: roundCurrency(convertedAmount),
  };
};
