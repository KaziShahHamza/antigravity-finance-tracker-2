// server/src/services/ratesService.ts

// Service for fetching, caching (24h in MongoDB), and converting multi-currency exchange rates with offline fallbacks.

import { ExchangeRate } from '../models/ExchangeRate.js';
import { User } from '../models/User.js';
import { roundCurrency } from '../utils/mathUtils.js';

export const BASELINE_RATES: Record<string, number> = {
  USD: 1.0,
  BDT: 110.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.0,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 155.0,
  SGD: 1.35,
  AED: 3.67,
  SAR: 3.75,
  CNY: 7.23,
  CHF: 0.91,
  MYR: 4.75,
  PKR: 278.0,
};

export interface RatesResult {
  baseCurrency: string;
  rates: Record<string, number>;
  fetchedAt: Date;
  isFallback: boolean;
}

const RATES_API_URL = 'https://open.er-api.com/v6/latest/USD';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetches fresh rates from open.er-api.com with timeout protection.
 */
export const fetchExternalRates = async (): Promise<Record<string, number> | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(RATES_API_URL, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };

    if (data.result === 'success' && data.rates && typeof data.rates === 'object') {
      return data.rates;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Retrieves exchange rates, caching in MongoDB for 24h, with fallbacks and custom user overrides.
 */
export const getExchangeRates = async (userId?: string): Promise<RatesResult> => {
  let ratesMap: Record<string, number> = { ...BASELINE_RATES };
  let fetchedAt = new Date();
  let isFallback = true;

  try {
    const cached = await ExchangeRate.findOne({ baseCurrency: 'USD' }).lean();

    const isCacheValid =
      cached && cached.expiresAt && new Date(cached.expiresAt).getTime() > Date.now();

    if (isCacheValid && cached.rates) {
      ratesMap =
        cached.rates instanceof Map ? Object.fromEntries(cached.rates) : { ...cached.rates };
      fetchedAt = cached.fetchedAt ? new Date(cached.fetchedAt) : new Date();
      isFallback = false;
    } else {
      const freshRates = await fetchExternalRates();
      if (freshRates) {
        ratesMap = freshRates;
        fetchedAt = new Date();
        isFallback = false;

        const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);
        await ExchangeRate.findOneAndUpdate(
          { baseCurrency: 'USD' },
          {
            baseCurrency: 'USD',
            rates: freshRates,
            fetchedAt,
            expiresAt,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else if (cached && cached.rates) {
        // Fallback to expired cache if external call fails
        ratesMap =
          cached.rates instanceof Map ? Object.fromEntries(cached.rates) : { ...cached.rates };
        fetchedAt = cached.fetchedAt ? new Date(cached.fetchedAt) : new Date();
        isFallback = true;
      }
    }
  } catch {
    // If MongoDB or network throws, fallback safely to baseline rates
    isFallback = true;
  }

  // Merge custom user exchange rates if user ID is provided
  if (userId) {
    try {
      const user = await User.findById(userId).select('customExchangeRates').lean();
      if (user && user.customExchangeRates) {
        const customRates =
          user.customExchangeRates instanceof Map
            ? Object.fromEntries(user.customExchangeRates)
            : (user.customExchangeRates as Record<string, number>);

        for (const [curr, customRate] of Object.entries(customRates)) {
          if (typeof customRate === 'number' && customRate > 0) {
            ratesMap[curr.toUpperCase()] = customRate;
          }
        }
      }
    } catch {
      // Ignore user lookup failure and continue with base rates
    }
  }

  return {
    baseCurrency: 'USD',
    rates: ratesMap,
    fetchedAt,
    isFallback,
  };
};

/**
 * Converts a monetary amount between currencies using 2-decimal rounded precision.
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number => {
  if (typeof amount !== 'number' || isNaN(amount) || amount === 0) {
    return 0;
  }

  const from = fromCurrency.toUpperCase().trim();
  const to = toCurrency.toUpperCase().trim();

  if (from === to) {
    return roundCurrency(amount);
  }

  const fromRate = rates[from];
  const toRate = rates[to];

  if (!fromRate || !toRate || fromRate <= 0 || toRate <= 0) {
    throw new Error(`Unsupported currency conversion from ${from} to ${to}`);
  }

  // Amount in base currency USD: amount / fromRate
  // Amount in target currency: amountInUSD * toRate
  const converted = (amount / fromRate) * toRate;
  return roundCurrency(converted);
};
