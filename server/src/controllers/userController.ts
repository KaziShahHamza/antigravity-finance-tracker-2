// server/src/controllers/userController.ts

// Express controller handlers for user profile retrieval, profile updates, password changes, and demo data seeding.

import { NextFunction, Request, Response } from 'express';
import type { UpdatePasswordInput, UpdateProfileInput } from '../schemas/userSchemas.js';
import {
  changeUserPassword,
  getUserProfile,
  seedDemoData,
  updateUserProfile,
} from '../services/userService.js';

interface CustomError extends Error {
  code?: string;
  statusCode?: number;
}

const handleUserError = (err: unknown, res: Response, next: NextFunction) => {
  const customErr = err as CustomError;
  if (customErr.statusCode) {
    res.status(customErr.statusCode).json({
      success: false,
      message: customErr.message,
      code: customErr.code || 'BAD_REQUEST',
    });
    return;
  }
  next(err);
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await getUserProfile(userId);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    handleUserError(error, res, next);
  }
};

export const updateProfile = async (
  req: Request<unknown, unknown, UpdateProfileInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await updateUserProfile(userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    handleUserError(error, res, next);
  }
};

export const updatePassword = async (
  req: Request<unknown, unknown, UpdatePasswordInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await changeUserPassword(userId, req.body);
    res.status(200).json({
      success: true,
      message:
        'Password updated successfully. Please sign in with your new password on other devices.',
    });
  } catch (error) {
    handleUserError(error, res, next);
  }
};

export const loadDemoData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await seedDemoData(userId);
    res.status(201).json({
      success: true,
      message: 'Demo financial data loaded successfully.',
      data: result,
    });
  } catch (error) {
    handleUserError(error, res, next);
  }
};
