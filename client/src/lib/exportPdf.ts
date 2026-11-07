// client/src/lib/exportPdf.ts

// Client-side PDF export generator formatting transaction histories into styled statements.

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PopulatedAccount, PopulatedCategory, Transaction, User } from '@/types';
import { formatCurrency, formatDate } from './formatters';

export interface ExportPdfOptions {
  transactions: Transaction[];
  user?: User | null;
  baseCurrency?: string;
  filename?: string;
}

/**
 * Builds a styled multi-page PDF financial statement and triggers a browser download.
 * Returns the jsPDF document instance.
 */
export function exportTransactionsToPdf({
  transactions,
  user,
  baseCurrency = 'USD',
  filename = `statement_${new Date().toISOString().split('T')[0]}.pdf`,
}: ExportPdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const generationDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 1. Header Banner
  doc.setFillColor(79, 70, 229); // Brand Indigo (#4f46e5)
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ANTIGRAVITY FINANCE', 40, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Financial Activity Statement', pageWidth - 40, 34, { align: 'right' });

  // 2. Metadata Section
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.text(`Account Holder: ${user?.name || 'Explorer'} (${user?.email || 'N/A'})`, 40, 80);
  doc.text(`Statement Date: ${generationDate}`, 40, 95);
  doc.text(`Base Currency: ${baseCurrency}`, 40, 110);

  // Summary totals
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const tx of transactions) {
    const amt = tx.convertedAmount ?? tx.amount;
    if (tx.type === 'income') totalIncome += amt;
    if (tx.type === 'expense') totalExpenses += amt;
  }

  doc.setFont('helvetica', 'bold');
  doc.text(`Total Records: ${transactions.length}`, pageWidth - 40, 80, { align: 'right' });
  doc.setTextColor(16, 185, 129); // Green
  doc.text(`Total In: +${formatCurrency(totalIncome, baseCurrency)}`, pageWidth - 40, 95, {
    align: 'right',
  });
  doc.setTextColor(239, 68, 68); // Red
  doc.text(`Total Out: -${formatCurrency(totalExpenses, baseCurrency)}`, pageWidth - 40, 110, {
    align: 'right',
  });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(40, 125, pageWidth - 40, 125);

  // 3. Transactions Table
  const tableRows = transactions.map((tx) => {
    const category = tx.categoryId as PopulatedCategory | undefined;
    const account = tx.accountId as PopulatedAccount | undefined;
    const destAccount = tx.destinationAccountId as PopulatedAccount | undefined;

    const accountDisplay =
      tx.type === 'transfer'
        ? `${account?.name || 'Wallet'} → ${destAccount?.name || 'Wallet'}`
        : account?.name || 'Account';

    const formattedAmount =
      tx.type === 'income'
        ? `+${formatCurrency(tx.amount, tx.currency)}`
        : tx.type === 'expense'
          ? `-${formatCurrency(tx.amount, tx.currency)}`
          : formatCurrency(tx.amount, tx.currency);

    return [
      formatDate(tx.date),
      tx.type.toUpperCase(),
      tx.description,
      category?.name || (tx.type === 'transfer' ? 'Transfer' : 'Uncategorized'),
      accountDisplay,
      formattedAmount,
    ];
  });

  autoTable(doc, {
    startY: 135,
    margin: { left: 40, right: 40 },
    head: [['Date', 'Type', 'Description', 'Category', 'Account', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      textColor: [51, 65, 85],
      fontSize: 8.5,
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 50 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 80 },
      4: { cellWidth: 90 },
      5: { cellWidth: 70, halign: 'right' },
    },
  });

  // Save to client disk if browser is present (skip in automated test runners)
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
    doc.save(filename);
  }

  return doc;
}
