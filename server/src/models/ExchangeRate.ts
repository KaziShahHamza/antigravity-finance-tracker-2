// server/src/models/ExchangeRate.ts

// Mongoose schema and model definition for caching 24h foreign exchange rates from open.er-api.com.

import { Schema, model, Document } from 'mongoose';

export interface IExchangeRate extends Document {
  baseCurrency: string;
  rates: Map<string, number>;
  fetchedAt: Date;
  expiresAt: Date;
}

const exchangeRateSchema = new Schema<IExchangeRate>(
  {
    baseCurrency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      trim: true,
      unique: true,
    },
    rates: {
      type: Map,
      of: Number,
      required: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB TTL index to auto-expire old rate caches after 24h
exchangeRateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ExchangeRate = model<IExchangeRate>('ExchangeRate', exchangeRateSchema);
