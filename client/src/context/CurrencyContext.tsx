// client/src/context/CurrencyContext.tsx

// Global React Context managing multi-currency exchange rates, active display currency, and formatters.

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';
import {
  BASELINE_RATES,
  convertAmount,
  formatCurrency,
  roundToTwoDecimals,
} from '@/lib/formatters';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  rates: Record<string, number>;
  isLoading: boolean;
  isFallback: boolean;
  formatAmount: (amount: number, fromCurrency?: string) => string;
  convertToDisplay: (amount: number, fromCurrency: string) => number;
  refetchRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<string>('USD');
  const [rates, setRates] = useState<Record<string, number>>(BASELINE_RATES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  // Sync with user's defaultCurrency once user is loaded
  useEffect(() => {
    if (user?.defaultCurrency) {
      setCurrencyState(user.defaultCurrency.toUpperCase());
    }
  }, [user?.defaultCurrency]);

  const fetchRates = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{
        baseCurrency: string;
        rates: Record<string, number>;
        isFallback: boolean;
      }>('/rates');

      if (res?.rates) {
        setRates(res.rates);
        setIsFallback(Boolean(res.isFallback));
      }
    } catch {
      // Keep baseline rates on network failure
      setRates(BASELINE_RATES);
      setIsFallback(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency.toUpperCase());
  };

  const convertToDisplay = useCallback(
    (amount: number, fromCurrency: string = currency): number => {
      return convertAmount(amount, fromCurrency, currency, rates);
    },
    [currency, rates]
  );

  const formatAmount = useCallback(
    (amount: number, fromCurrency: string = currency): string => {
      const converted = convertAmount(amount, fromCurrency, currency, rates);
      return formatCurrency(roundToTwoDecimals(converted), currency);
    },
    [currency, rates]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        isLoading,
        isFallback,
        formatAmount,
        convertToDisplay,
        refetchRates: fetchRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
