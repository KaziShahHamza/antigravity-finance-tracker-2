// client/src/lib/formatters.ts

// Currency, number, and date formatting utilities with multi-currency conversion support and fallback rates.

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

/**
 * Rounds a number to exactly two decimal places using epsilon rounding.
 */
export const roundToTwoDecimals = (val: number): number => {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

/**
 * Converts a monetary amount from one currency to another using provided or baseline exchange rates.
 */
export const convertAmount = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = BASELINE_RATES
): number => {
  if (typeof amount !== 'number' || isNaN(amount) || amount === 0) {
    return 0;
  }

  const from = fromCurrency.toUpperCase().trim();
  const to = toCurrency.toUpperCase().trim();

  if (from === to) {
    return roundToTwoDecimals(amount);
  }

  const ratesMap = { ...BASELINE_RATES, ...rates };
  const fromRate = ratesMap[from];
  const toRate = ratesMap[to];

  if (!fromRate || !toRate || fromRate <= 0 || toRate <= 0) {
    return roundToTwoDecimals(amount);
  }

  // Normalize via USD base rate
  const inUSD = amount / fromRate;
  const inTarget = inUSD * toRate;
  return roundToTwoDecimals(inTarget);
};

/**
 * Formats a numeric monetary value using Intl.NumberFormat with safe fallback.
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    amount = 0;
  }

  const code = currencyCode.toUpperCase().trim() || 'USD';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for custom or unsupported ISO currency codes
    return `${code} ${amount.toFixed(2)}`;
  }
};

/**
 * Formats an ISO string or Date into a human-readable date.
 */
export const formatDate = (
  dateInput: string | Date,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string => {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', options).format(d);
  } catch {
    return '';
  }
};

/**
 * Returns a human-friendly relative date or formatted date (e.g. "Today", "Yesterday").
 */
export const formatRelativeDate = (dateInput: string | Date): string => {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';

    const today = new Date();
    const isSameDay =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    if (isSameDay) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Yesterday';

    return formatDate(d);
  } catch {
    return '';
  }
};
