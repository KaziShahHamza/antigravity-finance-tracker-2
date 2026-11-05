// server/src/services/userService.ts

// Service layer handling user profile retrieval, profile updates, and password changes.

import bcrypt from 'bcryptjs';
import { IUser, User } from '../models/User.js';
import type { UpdatePasswordInput, UpdateProfileInput } from '../schemas/userSchemas.js';
import { seedDemoData, type DemoDataResult } from './demoDataService.js';

export { seedDemoData, type DemoDataResult };

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isVerified: boolean;
  defaultCurrency: string;
  monthlyBudgetLimit?: number | null;
  customExchangeRates: Record<string, number>;
  themePreference: string;
  createdAt: Date;
}

const mapUserToProfile = (user: IUser): UserProfileResponse => {
  const ratesObj: Record<string, number> = {};
  if (user.customExchangeRates instanceof Map) {
    user.customExchangeRates.forEach((val, key) => {
      ratesObj[key] = val;
    });
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    isVerified: user.isVerified,
    defaultCurrency: user.defaultCurrency,
    monthlyBudgetLimit: user.monthlyBudgetLimit ?? null,
    customExchangeRates: ratesObj,
    themePreference: user.themePreference,
    createdAt: user.createdAt,
  };
};

export const getUserProfile = async (userId: string): Promise<UserProfileResponse> => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as { code?: string; statusCode?: number }).code = 'USER_NOT_FOUND';
    (error as { code?: string; statusCode?: number }).statusCode = 404;
    throw error;
  }

  return mapUserToProfile(user);
};

export const updateUserProfile = async (
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfileResponse> => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as { code?: string; statusCode?: number }).code = 'USER_NOT_FOUND';
    (error as { code?: string; statusCode?: number }).statusCode = 404;
    throw error;
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.defaultCurrency !== undefined) user.defaultCurrency = input.defaultCurrency;
  if (input.monthlyBudgetLimit !== undefined)
    user.monthlyBudgetLimit = input.monthlyBudgetLimit ?? undefined;
  if (input.themePreference !== undefined) user.themePreference = input.themePreference;

  if (input.customExchangeRates !== undefined) {
    user.customExchangeRates = new Map(Object.entries(input.customExchangeRates));
  }

  await user.save();
  return mapUserToProfile(user);
};

export const changeUserPassword = async (
  userId: string,
  input: UpdatePasswordInput
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as { code?: string; statusCode?: number }).code = 'USER_NOT_FOUND';
    (error as { code?: string; statusCode?: number }).statusCode = 404;
    throw error;
  }

  if (!user.password) {
    const error = new Error(
      'Account was created via social authentication and does not have an existing password.'
    );
    (error as { code?: string; statusCode?: number }).code = 'PASSWORD_NOT_SET';
    (error as { code?: string; statusCode?: number }).statusCode = 400;
    throw error;
  }

  const isCurrentValid = await bcrypt.compare(input.currentPassword, user.password);
  if (!isCurrentValid) {
    const error = new Error('The current password provided is incorrect.');
    (error as { code?: string; statusCode?: number }).code = 'INVALID_CURRENT_PASSWORD';
    (error as { code?: string; statusCode?: number }).statusCode = 400;
    throw error;
  }

  user.password = await bcrypt.hash(input.newPassword, 10);
  user.refreshTokenHash = undefined; // Revoke all active sessions upon password change
  await user.save();
};
