// server/src/models/Account.ts

// Mongoose schema and model definition for multi-currency wallets and financial accounts.

import { Schema, model, Document, Types } from 'mongoose';

export type WalletType = 'cash' | 'bank' | 'bkash' | 'nagad' | 'credit' | 'other';

export interface IAccount extends Document {
  userId: Types.ObjectId;
  name: string;
  type: WalletType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['cash', 'bank', 'bkash', 'nagad', 'credit', 'other'],
      required: true,
      default: 'cash',
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#10b981', // Emerald default
      trim: true,
    },
    icon: {
      type: String,
      default: 'Wallet',
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly fetch non-archived user accounts ordered by creation
accountSchema.index({ userId: 1, isArchived: 1 });

export const Account = model<IAccount>('Account', accountSchema);
