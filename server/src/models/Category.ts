// server/src/models/Category.ts

// Mongoose schema and model definition for transaction categories with system defaults.

import { Schema, model, Document, Types } from 'mongoose';

export type CategoryType = 'income' | 'expense';

export interface ICategory extends Document {
  userId?: Types.ObjectId;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
      enum: ['income', 'expense'],
      required: true,
    },
    icon: {
      type: String,
      required: true,
      default: 'Tag',
      trim: true,
    },
    color: {
      type: String,
      required: true,
      default: '#64748b',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly fetch user categories plus system defaults
categorySchema.index({ userId: 1, type: 1 });

export const Category = model<ICategory>('Category', categorySchema);
