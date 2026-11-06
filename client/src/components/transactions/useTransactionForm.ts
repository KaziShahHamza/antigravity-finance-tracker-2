// client/src/components/transactions/useTransactionForm.ts

// Custom hook managing transaction form state, defaults, edit mode synchronization, and OCR auto-fill.

'use client';

import { useState, useEffect } from 'react';
import type { Account, Category, Transaction, ReceiptOcrResult, TransactionType } from '@/types';

interface UseTransactionFormParams {
  isOpen: boolean;
  accounts: Account[];
  categories: Category[];
  transactionToEdit?: Transaction | null;
}

export function useTransactionForm({
  isOpen,
  accounts,
  categories,
  transactionToEdit,
}: UseTransactionFormParams) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [destinationAmount, setDestinationAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [vendor, setVendor] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptOcrData, setReceiptOcrData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setCurrency(transactionToEdit.currency);

      const accId =
        typeof transactionToEdit.accountId === 'object'
          ? transactionToEdit.accountId._id || transactionToEdit.accountId.id || ''
          : transactionToEdit.accountId;
      setAccountId(accId);

      const destAccId =
        typeof transactionToEdit.destinationAccountId === 'object'
          ? transactionToEdit.destinationAccountId._id ||
            transactionToEdit.destinationAccountId.id ||
            ''
          : transactionToEdit.destinationAccountId || '';
      setDestinationAccountId(destAccId);

      setDestinationAmount(
        transactionToEdit.destinationAmount ? String(transactionToEdit.destinationAmount) : ''
      );

      const catId =
        typeof transactionToEdit.categoryId === 'object'
          ? transactionToEdit.categoryId._id || transactionToEdit.categoryId.id || ''
          : transactionToEdit.categoryId || '';
      setCategoryId(catId);

      setDate(
        transactionToEdit.date
          ? transactionToEdit.date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setDescription(transactionToEdit.description || '');
      setVendor(transactionToEdit.vendor || '');
      setReceiptUrl(transactionToEdit.receiptUrl || '');
      setReceiptOcrData(transactionToEdit.receiptOcrData || null);
    } else {
      setType('expense');
      setAmount('');
      const defaultAcc = accounts[0];
      setAccountId(defaultAcc ? defaultAcc.id || defaultAcc._id || '' : '');
      setCurrency(defaultAcc ? defaultAcc.currency : 'USD');
      setDestinationAccountId(accounts[1] ? accounts[1].id || accounts[1]._id || '' : '');
      setDestinationAmount('');
      const defaultCat = categories.find((c) => c.type === 'expense');
      setCategoryId(defaultCat ? defaultCat.id || defaultCat._id || '' : '');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setVendor('');
      setReceiptUrl('');
      setReceiptOcrData(null);
    }
  }, [transactionToEdit, accounts, categories, isOpen]);

  const handleAccountChange = (newAccId: string) => {
    setAccountId(newAccId);
    const selected = accounts.find((a) => (a.id || a._id) === newAccId);
    if (selected) {
      setCurrency(selected.currency);
    }
  };

  const handleOcrComplete = (ocrData: ReceiptOcrResult) => {
    if (ocrData.totalAmount) {
      setAmount(String(ocrData.totalAmount));
    }
    if (ocrData.currency) {
      setCurrency(ocrData.currency);
    }
    if (ocrData.vendor) {
      setVendor(ocrData.vendor);
      setDescription(`${ocrData.vendor} - Receipt`);
    }
    if (ocrData.date) {
      setDate(ocrData.date);
    }
    if (ocrData.receiptUrl) {
      setReceiptUrl(ocrData.receiptUrl);
    }
    setReceiptOcrData(ocrData as unknown as Record<string, unknown>);

    if (ocrData.suggestedCategory) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === ocrData.suggestedCategory.toLowerCase()
      );
      if (match) {
        setCategoryId(match.id || match._id || '');
      }
    }
  };

  return {
    type,
    setType,
    amount,
    setAmount,
    currency,
    accountId,
    setAccountId,
    destinationAccountId,
    setDestinationAccountId,
    destinationAmount,
    setDestinationAmount,
    categoryId,
    setCategoryId,
    date,
    setDate,
    description,
    setDescription,
    vendor,
    setVendor,
    receiptUrl,
    receiptOcrData,
    handleAccountChange,
    handleOcrComplete,
  };
}
