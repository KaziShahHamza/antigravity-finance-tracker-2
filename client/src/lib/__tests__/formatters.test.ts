// client/src/lib/__tests__/formatters.test.ts

// Unit tests for currency formatting, math precision rounding, and multi-currency conversion logic.

import { describe, it, expect } from 'vitest';
import {
  roundToTwoDecimals,
  convertAmount,
  formatCurrency,
  formatDate,
  formatRelativeDate,
  BASELINE_RATES,
} from '../formatters';

describe('formatters Unit Tests', () => {
  describe('roundToTwoDecimals', () => {
    it('accurately rounds numbers to 2 decimal places and handles float drift', () => {
      expect(roundToTwoDecimals(0.1 + 0.2)).toBe(0.3);
      expect(roundToTwoDecimals(10.555)).toBe(10.56);
      expect(roundToTwoDecimals(10.554)).toBe(10.55);
      expect(roundToTwoDecimals(NaN)).toBe(0);
      expect(roundToTwoDecimals(0)).toBe(0);
    });
  });

  describe('convertAmount', () => {
    const customRates = {
      USD: 1.0,
      BDT: 110.0,
      EUR: 0.9,
    };

    it('returns exact amount when from and to currencies match', () => {
      expect(convertAmount(150.75, 'USD', 'USD', customRates)).toBe(150.75);
      expect(convertAmount(200, 'bdt', 'BDT', customRates)).toBe(200);
    });

    it('returns 0 for zero or invalid amount', () => {
      expect(convertAmount(0, 'USD', 'BDT', customRates)).toBe(0);
      expect(convertAmount(NaN, 'USD', 'BDT', customRates)).toBe(0);
    });

    it('converts correctly between base USD and other currencies', () => {
      // 100 USD -> 11000 BDT
      expect(convertAmount(100, 'USD', 'BDT', customRates)).toBe(11000);
      // 100 USD -> 90 EUR
      expect(convertAmount(100, 'USD', 'EUR', customRates)).toBe(90);
    });

    it('converts correctly between two non-base currencies', () => {
      // 90 EUR -> 100 USD -> 11000 BDT
      expect(convertAmount(90, 'EUR', 'BDT', customRates)).toBe(11000);
    });

    it('falls back to baseline rates if currency is missing in custom rates', () => {
      const res = convertAmount(100, 'USD', 'GBP', {});
      expect(res).toBe(roundToTwoDecimals(100 * BASELINE_RATES.GBP));
    });
  });

  describe('formatCurrency', () => {
    it('formats USD currency correctly', () => {
      const result = formatCurrency(1234.56, 'USD', 'en-US');
      expect(result).toContain('1,234.56');
      expect(result).toMatch(/\$|USD/);
    });

    it('handles zero or invalid amount', () => {
      expect(formatCurrency(0, 'USD', 'en-US')).toContain('0.00');
      expect(formatCurrency(NaN, 'USD', 'en-US')).toContain('0.00');
    });

    it('formats BDT or other currencies gracefully', () => {
      const result = formatCurrency(5000, 'BDT', 'en-US');
      expect(result).toContain('5,000.00');
    });
  });

  describe('formatDate and formatRelativeDate', () => {
    it('formats valid dates to readable string', () => {
      const formatted = formatDate('2026-05-15T12:00:00Z');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('May');
    });

    it('handles invalid date inputs safely', () => {
      expect(formatDate('invalid-date')).toBe('');
      expect(formatRelativeDate('invalid-date')).toBe('');
    });

    it('identifies Today correctly in formatRelativeDate', () => {
      const today = new Date();
      expect(formatRelativeDate(today)).toBe('Today');
    });

    it('identifies Yesterday correctly in formatRelativeDate', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatRelativeDate(yesterday)).toBe('Yesterday');
    });
  });
});
