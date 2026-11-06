// server/tests/unit/ratesService.test.ts

// Unit tests for multi-currency conversion math, baseline fallbacks, and user rate overrides.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  convertCurrency,
  BASELINE_RATES,
  getExchangeRates,
} from '../../src/services/ratesService.js';
import { ExchangeRate } from '../../src/models/ExchangeRate.js';
import { User } from '../../src/models/User.js';

describe('ratesService Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('convertCurrency', () => {
    const mockRates: Record<string, number> = {
      USD: 1.0,
      BDT: 110.0,
      EUR: 0.92,
      JPY: 155.0,
      GBP: 0.8,
    };

    it('returns exact rounded amount when from and to currencies match', () => {
      expect(convertCurrency(100.555, 'USD', 'USD', mockRates)).toBe(100.56);
      expect(convertCurrency(500, 'bdt', 'BDT', mockRates)).toBe(500);
    });

    it('returns 0 when amount is 0 or NaN', () => {
      expect(convertCurrency(0, 'USD', 'BDT', mockRates)).toBe(0);
      expect(convertCurrency(NaN, 'USD', 'BDT', mockRates)).toBe(0);
    });

    it('converts correctly from base currency USD to target currency', () => {
      // 100 USD -> 100 * 110 = 11000 BDT
      expect(convertCurrency(100, 'USD', 'BDT', mockRates)).toBe(11000);
      // 10 USD -> 10 * 0.92 = 9.20 EUR
      expect(convertCurrency(10, 'USD', 'EUR', mockRates)).toBe(9.2);
    });

    it('converts correctly from non-USD currency to USD', () => {
      // 11000 BDT -> 11000 / 110 = 100 USD
      expect(convertCurrency(11000, 'BDT', 'USD', mockRates)).toBe(100);
    });

    it('converts cross-currencies correctly with 2-decimal rounding', () => {
      // 100 EUR -> (100 / 0.92) * 110 = 11956.5217... -> 11956.52 BDT
      const result = convertCurrency(100, 'EUR', 'BDT', mockRates);
      expect(result).toBe(11956.52);
    });

    it('throws error when an unsupported or unknown currency is specified', () => {
      expect(() => convertCurrency(100, 'XYZ', 'USD', mockRates)).toThrow(
        /Unsupported currency conversion/
      );
      expect(() => convertCurrency(100, 'USD', 'ABC', mockRates)).toThrow(
        /Unsupported currency conversion/
      );
    });
  });

  describe('getExchangeRates', () => {
    it('returns baseline fallback rates when no cache is in db and fetch fails', async () => {
      vi.spyOn(ExchangeRate, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as unknown as ReturnType<typeof ExchangeRate.findOne>);

      // fetch will fail in unit test environment or return null
      const result = await getExchangeRates();
      expect(result.baseCurrency).toBe('USD');
      expect(result.rates.USD).toBe(1.0);
      expect(result.rates.BDT).toBe(BASELINE_RATES.BDT);
    });

    it('returns cached rates if valid cache exists in MongoDB', async () => {
      const futureDate = new Date(Date.now() + 1000000);
      vi.spyOn(ExchangeRate, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          baseCurrency: 'USD',
          rates: { USD: 1.0, BDT: 120.0, EUR: 0.9 },
          fetchedAt: new Date(),
          expiresAt: futureDate,
        }),
      } as unknown as ReturnType<typeof ExchangeRate.findOne>);

      const result = await getExchangeRates();
      expect(result.isFallback).toBe(false);
      expect(result.rates.BDT).toBe(120.0);
      expect(result.rates.EUR).toBe(0.9);
    });

    it('applies user customExchangeRates over the base rates', async () => {
      vi.spyOn(ExchangeRate, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          baseCurrency: 'USD',
          rates: { USD: 1.0, BDT: 110.0, EUR: 0.92 },
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 1000000),
        }),
      } as unknown as ReturnType<typeof ExchangeRate.findOne>);

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            _id: 'user123',
            customExchangeRates: {
              BDT: 125.5, // Custom override for BDT
            },
          }),
        }),
      } as unknown as ReturnType<typeof User.findById>);

      const result = await getExchangeRates('user123');
      expect(result.rates.BDT).toBe(125.5);
      expect(result.rates.EUR).toBe(0.92);
      expect(result.rates.USD).toBe(1.0);
    });
  });
});
