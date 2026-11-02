// server/src/models/User.ts

// Mongoose schema and model definition for User accounts, authentication credentials, and preferences.

import { Schema, model, Document } from 'mongoose';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatarUrl?: string;
  isVerified: boolean;
  verificationOtpHash?: string;
  verificationOtpExpiresAt?: Date;
  passwordResetOtpHash?: string;
  passwordResetOtpExpiresAt?: Date;
  resendCooldownUntil?: Date;
  defaultCurrency: string;
  monthlyBudgetLimit?: number;
  customExchangeRates?: Map<string, number>;
  themePreference: ThemePreference;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: function (this: IUser) {
        // Password is only mandatory if the user is not authenticated via Google OAuth
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationOtpHash: {
      type: String,
      default: null,
    },
    verificationOtpExpiresAt: {
      type: Date,
      default: null,
    },
    passwordResetOtpHash: {
      type: String,
      default: null,
    },
    passwordResetOtpExpiresAt: {
      type: Date,
      default: null,
    },
    resendCooldownUntil: {
      type: Date,
      default: null,
    },
    defaultCurrency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    monthlyBudgetLimit: {
      type: Number,
      min: 0,
      default: null,
    },
    customExchangeRates: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', userSchema);
