// server/src/controllers/accountController.ts

// Controller actions for account/wallet CRUD operations and inter-account fund transfers.

import { Request, Response, NextFunction } from 'express';
import {
  getUserAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../services/accountService.js';
import { executeTransfer } from '../services/transferService.js';

/**
 * GET /api/accounts
 * Returns user accounts with converted balances and total aggregate balance.
 */
export const getAccountsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const includeArchived = req.query.includeArchived === 'true';
    const summary = await getUserAccounts(userId, includeArchived);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/accounts/:id
 * Returns a single account by ID.
 */
export const getAccountByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const account = await getAccountById(userId, req.params.id);

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/accounts
 * Creates a new account/wallet.
 */
export const createAccountHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const account = await createAccount(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/accounts/:id
 * Updates an existing account's details.
 */
export const updateAccountHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const account = await updateAccount(userId, req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/accounts/:id
 * Deletes or archives an account.
 */
export const deleteAccountHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await deleteAccount(userId, req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { archived: result.archived },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/accounts/transfer
 * Atomically transfers funds between accounts with currency conversion and balance reconciliation.
 */
export const transferFundsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await executeTransfer(userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Transfer completed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
