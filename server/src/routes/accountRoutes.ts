// server/src/routes/accountRoutes.ts

// Express routes for account CRUD operations and inter-account transfers.

import { Router } from 'express';
import {
  getAccountsHandler,
  getAccountByIdHandler,
  createAccountHandler,
  updateAccountHandler,
  deleteAccountHandler,
  transferFundsHandler,
} from '../controllers/accountController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createAccountSchema,
  updateAccountSchema,
  accountIdParamSchema,
  transferSchema,
} from '../schemas/accountSchemas.js';

const router = Router();

// Protect all account routes with JWT authentication
router.use(authenticateToken);

// Transfer funds between accounts (must precede /:id)
router.post('/transfer', validateRequest({ body: transferSchema }), transferFundsHandler);

// Account CRUD routes
router.get('/', getAccountsHandler);
router.post('/', validateRequest({ body: createAccountSchema }), createAccountHandler);
router.get('/:id', validateRequest({ params: accountIdParamSchema }), getAccountByIdHandler);
router.patch(
  '/:id',
  validateRequest({ params: accountIdParamSchema, body: updateAccountSchema }),
  updateAccountHandler
);
router.delete('/:id', validateRequest({ params: accountIdParamSchema }), deleteAccountHandler);

export default router;
