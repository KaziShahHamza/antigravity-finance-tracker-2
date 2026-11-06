// server/src/schemas/categorySchemas.ts

// Zod validation schemas for creating, updating, and querying transaction categories.

import { z } from 'zod';

export const categoryTypeEnum = z.enum(['income', 'expense']);

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(100, 'Category name cannot exceed 100 characters'),
  type: categoryTypeEnum,
  icon: z.string().trim().max(50).optional().default('Tag'),
  color: z.string().trim().max(30).optional().default('#64748b'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name cannot be empty')
    .max(100, 'Category name cannot exceed 100 characters')
    .optional(),
  icon: z.string().trim().max(50).optional(),
  color: z.string().trim().max(30).optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const categoryIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format'),
});

export const categoryQuerySchema = z.object({
  type: categoryTypeEnum.optional(),
});

export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
