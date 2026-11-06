// server/src/services/categoryService.ts

// Service managing category CRUD operations, unique constraints, and system default protection.

import { Types } from 'mongoose';
import { Category, ICategory, CategoryType } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/categorySchemas.js';
import { HttpError } from '../middlewares/errorHandler.js';

/**
 * Retrieves all categories belonging to the user, optionally filtered by income/expense type.
 */
export const getUserCategories = async (userId: string, type?: CategoryType) => {
  const query: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
  };

  if (type) {
    query.type = type;
  }

  return Category.find(query).sort({ isDefault: -1, name: 1 }).lean();
};

/**
 * Creates a custom category for the user, preventing duplicates within the same type.
 */
export const createCategory = async (
  userId: string,
  input: CreateCategoryInput
): Promise<ICategory> => {
  const userObjectId = new Types.ObjectId(userId);

  // Check case-insensitive duplicate name within the same category type
  const existing = await Category.findOne({
    userId: userObjectId,
    type: input.type,
    name: { $regex: new RegExp(`^${input.name.trim()}$`, 'i') },
  });

  if (existing) {
    throw new HttpError(`A ${input.type} category named "${input.name}" already exists`, 400);
  }

  return Category.create({
    userId: userObjectId,
    name: input.name.trim(),
    type: input.type,
    icon: input.icon || 'Tag',
    color: input.color || '#64748b',
    isDefault: false,
  });
};

/**
 * Updates a custom category's name, icon, or color.
 */
export const updateCategory = async (
  userId: string,
  categoryId: string,
  input: UpdateCategoryInput
): Promise<ICategory> => {
  const category = await Category.findOne({
    _id: new Types.ObjectId(categoryId),
    userId: new Types.ObjectId(userId),
  });

  if (!category) {
    throw new HttpError('Category not found', 404);
  }

  if (input.name && input.name.trim() !== category.name) {
    const existing = await Category.findOne({
      _id: { $ne: category._id },
      userId: category.userId,
      type: category.type,
      name: { $regex: new RegExp(`^${input.name.trim()}$`, 'i') },
    });

    if (existing) {
      throw new HttpError(`A ${category.type} category named "${input.name}" already exists`, 400);
    }

    category.name = input.name.trim();
  }

  if (input.icon !== undefined) {
    category.icon = input.icon;
  }

  if (input.color !== undefined) {
    category.color = input.color;
  }

  await category.save();
  return category;
};

/**
 * Deletes a custom category, protecting system defaults and categories linked to transactions.
 */
export const deleteCategory = async (userId: string, categoryId: string): Promise<void> => {
  const category = await Category.findOne({
    _id: new Types.ObjectId(categoryId),
    userId: new Types.ObjectId(userId),
  });

  if (!category) {
    throw new HttpError('Category not found', 404);
  }

  if (category.isDefault) {
    throw new HttpError('System default categories cannot be deleted', 400);
  }

  const inUseCount = await Transaction.countDocuments({
    userId: new Types.ObjectId(userId),
    categoryId: category._id,
  });

  if (inUseCount > 0) {
    throw new HttpError(
      `Cannot delete category because it is used by ${inUseCount} transaction(s)`,
      400
    );
  }

  await Category.deleteOne({ _id: category._id });
};
