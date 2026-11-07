// server/src/controllers/dashboardController.ts

// Request handler for unified dashboard financial analytics and summary data.

import { Request, Response, NextFunction } from 'express';
import { getDashboardSummary } from '../services/dashboardService.js';

export const getDashboardSummaryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const summary = await getDashboardSummary(userId);

    res.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
