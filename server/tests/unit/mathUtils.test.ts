// server/tests/unit/mathUtils.test.ts

// Unit tests for currency rounding and floating-point math precision helpers.

import { describe, it, expect } from 'vitest';
import { roundCurrency, sumCurrency } from '../../src/utils/mathUtils.js';

describe('mathUtils', () => {
  describe('roundCurrency', () => {
    it('rounds standard floating point drift like 0.1 + 0.2 to 0.3', () => {
      const result = 0.1 + 0.2;
      expect(result).not.toBe(0.3); // IEEE 754 drift (0.30000000000000004)
      expect(roundCurrency(result)).toBe(0.3);
    });

    it('rounds half-up correctly at 2 decimal places', () => {
      expect(roundCurrency(12.345)).toBe(12.35);
      expect(roundCurrency(12.344)).toBe(12.34);
      expect(roundCurrency(10.005)).toBe(10.01);
    });

    it('handles negative values accurately', () => {
      expect(roundCurrency(-50.256)).toBe(-50.26);
      expect(roundCurrency(-50.254)).toBe(-50.25);
    });

    it('handles 0, integers, and edge-cases', () => {
      expect(roundCurrency(0)).toBe(0);
      expect(roundCurrency(100)).toBe(100);
      expect(roundCurrency(NaN)).toBe(0);
      expect(roundCurrency('invalid' as unknown as number)).toBe(0);
    });
  });

  describe('sumCurrency', () => {
    it('sums numbers with decimal precision', () => {
      const items = [19.99, 5.5, 0.01, 10.25];
      expect(sumCurrency(items)).toBe(35.75);
    });

    it('avoids floating point accumulation errors across long arrays', () => {
      // 0.1 added 10 times in raw JS equals 0.9999999999999999
      const tenDimes = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
      expect(sumCurrency(tenDimes)).toBe(1.0);
    });

    it('handles empty arrays and NaN values gracefully', () => {
      expect(sumCurrency([])).toBe(0);
      expect(sumCurrency([10.5, NaN, 2.5])).toBe(13);
    });
  });
});
