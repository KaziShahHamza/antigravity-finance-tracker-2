// client/tests/unit/CurrencyContext.test.tsx

// Unit tests for CurrencyContext provider, active currency switching, and live conversion helpers.

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CurrencyProvider, useCurrency } from '@/context/CurrencyContext';
import { api } from '@/lib/api';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'u1', email: 'test@example.com', defaultCurrency: 'USD' },
    isAuthenticated: true,
  })),
}));

describe('CurrencyContext Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides default currency and formats amounts accurately', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      baseCurrency: 'USD',
      rates: { USD: 1.0, BDT: 110.0, EUR: 0.9 },
      isFallback: false,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CurrencyProvider>{children}</CurrencyProvider>
    );

    const { result } = renderHook(() => useCurrency(), { wrapper });

    expect(result.current.currency).toBe('USD');

    // Wait for effect to load rates
    await act(async () => {
      await Promise.resolve();
    });

    // Formatting 100 USD in USD
    const formatted = result.current.formatAmount(100, 'USD');
    expect(formatted).toContain('100.00');

    // Converting 100 USD to BDT when currency is BDT
    act(() => {
      result.current.setCurrency('BDT');
    });

    expect(result.current.currency).toBe('BDT');
    expect(result.current.convertToDisplay(100, 'USD')).toBe(11000);
  });

  it('throws error when useCurrency is used outside CurrencyProvider', () => {
    expect(() => renderHook(() => useCurrency())).toThrow(
      'useCurrency must be used within a CurrencyProvider'
    );
  });
});
