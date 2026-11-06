// server/src/controllers/categoryController.ts

// Controller actions for transaction category CRUD operations and retrieval.

import { Request, Response, NextFunction } from 'express';
import {
  getUserCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categoryService.js';
import { CategoryType } from '../models/Category.js';

/**
 * GET /api/categories
 * Returns all categories for the authenticated user, optionally filtered by type.
 */
export const getCategoriesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const type = req.query.type as CategoryType | undefined;
    const categories = await getUserCategories(userId, type);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/categories
 * Creates a new custom category.
 */
export const createCategoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const category = await createCategory(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/categories/:id
 * Updates an existing custom category.
 */
export const updateCategoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const category = await updateCategory(userId, req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/categories/:id
 * Deletes a custom category if not in use and not a system default.
 */
export const deleteCategoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await deleteCategory(userId, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
