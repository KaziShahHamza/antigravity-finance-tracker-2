// server/src/controllers/transactionController.ts

// Controller actions for transaction creation, updates with balance reconciliation, history, and deletion.

import { Request, Response, NextFunction } from 'express';
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
  getTransactionById,
} from '../services/transactionService.js';
import { TransactionQueryParams } from '../schemas/transactionSchemas.js';

/**
 * GET /api/transactions
 * Returns paginated, sorted, and filtered transaction history.
 */
export const getTransactionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query = req.query as unknown as TransactionQueryParams;
    const result = await getTransactions(userId, query);

    res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/:id
 * Returns a single transaction by ID.
 */
export const getTransactionByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const transaction = await getTransactionById(userId, req.params.id);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/transactions
 * Creates a new transaction and atomically reconciles account balance(s).
 */
export const createTransactionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const transaction = await createTransaction(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/transactions/:id
 * Updates an existing transaction, reversing prior balance impacts and applying updated values.
 */
export const updateTransactionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const transaction = await updateTransaction(userId, req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/transactions/:id
 * Deletes a transaction and reverses its balance impact on affected accounts.
 */
export const deleteTransactionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await deleteTransaction(userId, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
