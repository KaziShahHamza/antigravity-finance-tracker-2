// server/src/schemas/userSchemas.ts

// Zod validation schemas for user profile updates and password change requests.

import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  defaultCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Currency must be a 3-letter ISO code')
    .optional(),
  monthlyBudgetLimit: z
    .number()
    .min(0, 'Monthly budget limit cannot be negative')
    .nullable()
    .optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
  customExchangeRates: z.record(z.string(), z.number().positive()).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])/,
        'New password must contain at least 1 letter and 1 number'
      ),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
