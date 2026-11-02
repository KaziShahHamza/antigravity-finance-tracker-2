// server/src/utils/mathUtils.ts

// Currency math utilities ensuring IEEE-754 floating-point precision and 2-decimal rounding.

/**
 * Rounds a numeric currency value to exactly 2 decimal places using epsilon rounding
 * to prevent IEEE-754 floating-point representation drift (e.g., 0.1 + 0.2 = 0.30000000000000004).
 *
 * @param amount - The raw number to round.
 * @returns The rounded number rounded to two decimal places.
 */
export const roundCurrency = (amount: number): number => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

/**
 * Accurately sums an array of currency numbers using 2-decimal epsilon rounding.
 *
 * @param amounts - Array of numbers to sum.
 * @returns The rounded total sum.
 */
export const sumCurrency = (amounts: number[]): number => {
  const total = amounts.reduce((acc, curr) => acc + (isNaN(curr) ? 0 : curr), 0);
  return roundCurrency(total);
};
