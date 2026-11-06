// server/src/schemas/transactionSchemas.ts

// Zod validation schemas for creating, updating, and filtering transaction records.

import { z } from 'zod';

export const transactionTypeEnum = z.enum(['income', 'expense', 'transfer']);

export const createTransactionSchema = z
  .object({
    accountId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid account ID format'),
    type: transactionTypeEnum,
    amount: z.number().positive('Transaction amount must be greater than zero'),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .length(3, 'Currency must be a 3-letter code')
      .optional(),
    destinationAccountId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid destination account ID format')
      .optional(),
    destinationAmount: z
      .number()
      .positive('Destination amount must be greater than zero')
      .optional(),
    destinationCurrency: z
      .string()
      .trim()
      .toUpperCase()
      .length(3, 'Destination currency must be a 3-letter code')
      .optional(),
    categoryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format')
      .optional(),
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
      .optional(),
    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .max(255, 'Description cannot exceed 255 characters'),
    vendor: z.string().trim().max(100).optional(),
    receiptUrl: z.string().trim().max(1000).optional(),
    receiptOcrData: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'transfer') {
        return !!data.destinationAccountId && data.destinationAccountId !== data.accountId;
      }
      return true;
    },
    {
      message: 'Transfers require a distinct destination account',
      path: ['destinationAccountId'],
    }
  );

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = z.object({
  accountId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid account ID format')
    .optional(),
  type: transactionTypeEnum.optional(),
  amount: z.number().positive('Transaction amount must be greater than zero').optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Currency must be a 3-letter code')
    .optional(),
  destinationAccountId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid destination account ID format')
    .optional(),
  destinationAmount: z.number().positive('Destination amount must be greater than zero').optional(),
  destinationCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Destination currency must be a 3-letter code')
    .optional(),
  categoryId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format')
    .nullable()
    .optional(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, 'Description cannot be empty')
    .max(255, 'Description cannot exceed 255 characters')
    .optional(),
  vendor: z.string().trim().max(100).optional(),
  receiptUrl: z.string().trim().max(1000).optional(),
  receiptOcrData: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const transactionIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid transaction ID format'),
});

export const transactionQuerySchema = z.object({
  search: z.string().trim().optional(),
  type: transactionTypeEnum.optional(),
  accountId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid account ID')
    .optional(),
  categoryId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
    .optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date format' })
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date format' })
    .optional(),
  sortBy: z.enum(['date', 'amount', 'convertedAmount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type TransactionQueryParams = z.infer<typeof transactionQuerySchema>;
