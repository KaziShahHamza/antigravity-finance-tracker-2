// client/src/lib/exportCsv.ts

// Client-side CSV export generator converting transaction records into downloadable spreadsheets.

import Papa from 'papaparse';
import { PopulatedAccount, PopulatedCategory, Transaction } from '@/types';
import { formatDate } from './formatters';

export interface CsvTransactionRow {
  Date: string;
  Type: string;
  Description: string;
  Vendor: string;
  Category: string;
  Account: string;
  'Destination Account': string;
  Amount: number;
  Currency: string;
  'Converted Amount': number;
}

/**
 * Transforms transactions into structured CSV rows and triggers a browser download.
 * Returns the unparsed CSV string for testing and verification.
 */
export function exportTransactionsToCsv(
  transactions: Transaction[],
  filename: string = `transactions_${new Date().toISOString().split('T')[0]}.csv`
): string {
  const rows: CsvTransactionRow[] = transactions.map((tx) => {
    const category = tx.categoryId as PopulatedCategory | undefined;
    const account = tx.accountId as PopulatedAccount | undefined;
    const destAccount = tx.destinationAccountId as PopulatedAccount | undefined;

    return {
      Date: formatDate(tx.date),
      Type: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
      Description: tx.description || '',
      Vendor: tx.vendor || '',
      Category: category?.name || (tx.type === 'transfer' ? 'Transfer' : 'Uncategorized'),
      Account: account?.name || 'Account',
      'Destination Account': destAccount?.name || '',
      Amount: tx.amount,
      Currency: tx.currency,
      'Converted Amount': tx.convertedAmount ?? tx.amount,
    };
  });

  const csvContent = Papa.unparse(rows, {
    quotes: true,
    header: true,
  });

  // Trigger browser download if running in client browser environment (skip in automated test runners)
  if (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    process.env.NODE_ENV !== 'test'
  ) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return csvContent;
}
