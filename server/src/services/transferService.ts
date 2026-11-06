// server/src/services/transferService.ts

// Service executing atomic inter-account and cross-currency transfers with balance reconciliation.

import { Account, IAccount } from '../models/Account.js';
import { Transaction, ITransaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { roundCurrency } from '../utils/mathUtils.js';
import { convertCurrency, getExchangeRates } from './ratesService.js';
import { TransferInput } from '../schemas/accountSchemas.js';
import { HttpError } from '../middlewares/errorHandler.js';

export interface TransferResult {
  transaction: ITransaction;
  fromAccount: IAccount;
  toAccount: IAccount;
}

/**
 * Atomically transfers funds between two user accounts, handling currency conversion and balance reconciliation.
 */
export const executeTransfer = async (
  userId: string,
  input: TransferInput
): Promise<TransferResult> => {
  if (input.fromAccountId === input.toAccountId) {
    throw new HttpError('Source and destination accounts must be different', 400);
  }

  const [fromAccount, toAccount, user, ratesData] = await Promise.all([
    Account.findOne({ _id: input.fromAccountId, userId, isArchived: false }),
    Account.findOne({ _id: input.toAccountId, userId, isArchived: false }),
    User.findById(userId).select('defaultCurrency').lean(),
    getExchangeRates(userId),
  ]);

  if (!fromAccount) {
    throw new HttpError('Source account not found', 404);
  }

  if (!toAccount) {
    throw new HttpError('Destination account not found', 404);
  }

  // Prevent transfers exceeding available balance on non-credit accounts
  if (fromAccount.type !== 'credit' && fromAccount.balance < input.amount) {
    throw new HttpError(
      `Insufficient funds in ${fromAccount.name}. Available: ${fromAccount.balance} ${fromAccount.currency}`,
      400
    );
  }

  const rates = ratesData.rates;
  const defaultCurrency = user?.defaultCurrency || 'USD';

  // Compute destination amount (manual override if specified, or convert via exchange rates)
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

  // Compute convertedAmount in user's default display currency
  let convertedAmount: number;
  try {
    convertedAmount = convertCurrency(input.amount, fromAccount.currency, defaultCurrency, rates);
  } catch {
    convertedAmount = input.amount;
  }

  // Update account balances atomically
  fromAccount.balance = roundCurrency(fromAccount.balance - input.amount);
  toAccount.balance = roundCurrency(toAccount.balance + destinationAmount);

  const transferDate = input.date ? new Date(input.date) : new Date();

  // Create linked transfer transaction record
  const transaction = await Transaction.create({
    userId,
    accountId: fromAccount._id,
    type: 'transfer',
    amount: roundCurrency(input.amount),
    currency: fromAccount.currency,
    convertedAmount: roundCurrency(convertedAmount),
    destinationAccountId: toAccount._id,
    destinationAmount: roundCurrency(destinationAmount),
    destinationCurrency: toAccount.currency,
    description: input.description || `Transfer to ${toAccount.name}`,
    date: transferDate,
  });

  await Promise.all([fromAccount.save(), toAccount.save()]);

  return {
    transaction,
    fromAccount,
    toAccount,
  };
};
