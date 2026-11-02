// server/src/models/Transaction.ts

// Mongoose schema and model definition for income, expense, transfer transactions, and OCR receipt data.

import { Schema, model, Document, Types } from 'mongoose';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  currency: string;
  convertedAmount: number; // Converted to user's defaultCurrency at transaction time
  destinationAccountId?: Types.ObjectId; // For 'transfer' transactions
  destinationAmount?: number; // Credited amount in destination wallet currency
  destinationCurrency?: string;
  categoryId?: Types.ObjectId; // Required for 'income' and 'expense'
  date: Date;
  description: string;
  vendor?: string;
  receiptUrl?: string;
  receiptOcrData?: Record<string, unknown>;
  isDemo?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'transfer'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    convertedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    destinationAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    destinationAmount: {
      type: Number,
      min: 0.01,
      default: null,
    },
    destinationCurrency: {
      type: String,
      uppercase: true,
      trim: true,
      default: null,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    vendor: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    receiptOcrData: {
      type: Schema.Types.Mixed,
      default: null,
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for history, filtering, and monthly aggregations
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
transactionSchema.index({ userId: 1, accountId: 1, date: -1 });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
