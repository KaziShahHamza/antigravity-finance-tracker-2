// server/src/schemas/budgetSchemas.ts

// Zod validation schemas for budget creation, updates, and monthly progress queries.

import { z } from 'zod';

export const createBudgetSchema = z.object({
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format'),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  limitAmount: z.coerce.number().positive('Budget limit must be greater than zero'),
  currency: z.string().length(3).toUpperCase().optional().default('USD'),
});

export const updateBudgetSchema = z.object({
  limitAmount: z.coerce.number().positive('Budget limit must be greater than zero').optional(),
  currency: z.string().length(3).toUpperCase().optional(),
});

export const getBudgetsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type GetBudgetsQuery = z.infer<typeof getBudgetsQuerySchema>;
