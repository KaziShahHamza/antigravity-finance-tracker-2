// server/src/models/Budget.ts

// Mongoose schema and model definition for category-based monthly spending limits and alerts.

import { Schema, model, Document, Types } from 'mongoose';

export interface IBudget extends Document {
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  month: number; // 1 - 12
  year: number; // e.g. 2026
  limitAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2020,
      max: 2100,
    },
    limitAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring only one budget limit per user, category, month, and year
budgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });

export const Budget = model<IBudget>('Budget', budgetSchema);
