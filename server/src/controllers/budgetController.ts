// server/src/controllers/budgetController.ts

// Request handlers for budget creation, monthly progress retrieval, updates, and deletion.

import { Request, Response, NextFunction } from 'express';
import {
  getBudgetsWithProgress,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../services/budgetService.js';
import { CreateBudgetInput, UpdateBudgetInput, GetBudgetsQuery } from '../schemas/budgetSchemas.js';

export const getBudgetsHandler = async (
  req: Request<unknown, unknown, unknown, GetBudgetsQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { month, year } = req.query;
    const progress = await getBudgetsWithProgress(userId, month, year);

    res.status(200).json({
      success: true,
      message: 'Monthly budgets retrieved successfully',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

export const createBudgetHandler = async (
  req: Request<unknown, unknown, CreateBudgetInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const budget = await createBudget(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Budget limit created successfully',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBudgetHandler = async (
  req: Request<{ id: string }, unknown, UpdateBudgetInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const budgetId = req.params.id;
    const updated = await updateBudget(userId, budgetId, req.body);

    res.status(200).json({
      success: true,
      message: 'Budget limit updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBudgetHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const budgetId = req.params.id;
    await deleteBudget(userId, budgetId);

    res.status(200).json({
      success: true,
      message: 'Budget limit deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
