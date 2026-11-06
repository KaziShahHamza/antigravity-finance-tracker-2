// server/src/schemas/accountSchemas.ts

// Zod validation schemas for creating, updating, and transferring between financial accounts/wallets.

import { z } from 'zod';

export const walletTypeEnum = z.enum(['cash', 'bank', 'bkash', 'nagad', 'credit', 'other']);

export const createAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Account name is required')
    .max(100, 'Account name cannot exceed 100 characters'),
  type: walletTypeEnum.default('cash'),
  balance: z.number().default(0),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Currency must be a 3-letter code')
    .default('USD'),
  color: z.string().trim().max(30).optional().default('#10b981'),
  icon: z.string().trim().max(50).optional().default('Wallet'),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Account name cannot be empty')
    .max(100, 'Account name cannot exceed 100 characters')
    .optional(),
  type: walletTypeEnum.optional(),
  balance: z.number().optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Currency must be a 3-letter code')
    .optional(),
  color: z.string().trim().max(30).optional(),
  icon: z.string().trim().max(50).optional(),
  isArchived: z.boolean().optional(),
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export const accountIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid account ID format'),
});

export const transferSchema = z
  .object({
    fromAccountId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid source account ID'),
    toAccountId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid destination account ID'),
    amount: z.number().positive('Transfer amount must be greater than zero'),
    destinationAmount: z.number().positive('Destination amount must be positive').optional(),
    description: z.string().trim().max(255).optional().default('Account Transfer'),
    date: z.string().datetime().optional().or(z.date().optional()),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'Source and destination accounts must be different',
    path: ['toAccountId'],
  });

export type TransferInput = z.infer<typeof transferSchema>;
