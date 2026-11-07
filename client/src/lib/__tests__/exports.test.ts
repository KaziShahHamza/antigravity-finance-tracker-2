// client/src/lib/__tests__/exports.test.ts

// Unit tests for client-side CSV and PDF export generator functions.

import { describe, it, expect, vi } from 'vitest';
import { exportTransactionsToCsv } from '../exportCsv';
import { exportTransactionsToPdf } from '../exportPdf';
import type { Transaction, User } from '@/types';

describe('Financial Report Export Utilities', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-101',
      type: 'income',
      amount: 4500,
      currency: 'USD',
      convertedAmount: 4500,
      date: '2026-11-01T10:00:00.000Z',
      description: 'Monthly Salary',
      vendor: 'Acme Corp',
      accountId: { name: 'Main Checking', type: 'bank', currency: 'USD' },
      categoryId: { name: 'Salary', type: 'income' },
    },
    {
      id: 'tx-102',
      type: 'expense',
      amount: 85.25,
      currency: 'USD',
      convertedAmount: 85.25,
      date: '2026-11-02T14:30:00.000Z',
      description: 'Weekly Groceries',
      vendor: 'Whole Foods',
      accountId: { name: 'Cash', type: 'cash', currency: 'USD' },
      categoryId: { name: 'Groceries', type: 'expense' },
    },
    {
      id: 'tx-103',
      type: 'transfer',
      amount: 500,
      currency: 'USD',
      convertedAmount: 500,
      destinationAmount: 55000,
      destinationCurrency: 'BDT',
      date: '2026-11-03T18:00:00.000Z',
      description: 'Transfer to bKash',
      accountId: { name: 'Main Checking', type: 'bank', currency: 'USD' },
      destinationAccountId: { name: 'bKash Wallet', type: 'bkash', currency: 'BDT' },
    },
  ];

  const mockUser: User = {
    id: 'user-1',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    isVerified: true,
    defaultCurrency: 'USD',
    themePreference: 'system',
  };

  describe('exportTransactionsToCsv', () => {
    it('generates valid CSV string with headers and escaped transaction rows', () => {
      const csv = exportTransactionsToCsv(mockTransactions, 'test.csv');

      // Verify headers
      expect(csv).toContain('"Date"');
      expect(csv).toContain('"Type"');
      expect(csv).toContain('"Description"');
      expect(csv).toContain('"Amount"');

      // Verify rows
      expect(csv).toContain('Monthly Salary');
      expect(csv).toContain('Weekly Groceries');
      expect(csv).toContain('Transfer to bKash');
      expect(csv).toContain('Main Checking');
      expect(csv).toContain('bKash Wallet');
    });
  });

  describe('exportTransactionsToPdf', () => {
    it('constructs jsPDF instance with metadata and table formatting without error', () => {
      const doc = exportTransactionsToPdf({
        transactions: mockTransactions,
        user: mockUser,
        baseCurrency: 'USD',
        filename: 'test.pdf',
      });

      expect(doc).toBeDefined();
      expect(typeof doc.save).toBe('function');
    });
  });
});
