// server/src/routes/transactionRoutes.ts

// Express routes for transaction CRUD operations, history, and filtering.

import { Router } from 'express';
import {
  getTransactionsHandler,
  getTransactionByIdHandler,
  createTransactionHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
} from '../controllers/transactionController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionIdParamSchema,
  transactionQuerySchema,
} from '../schemas/transactionSchemas.js';

const router = Router();

// Protect all transaction routes with JWT authentication
router.use(authenticateToken);

// Transaction routes
router.get('/', validateRequest({ query: transactionQuerySchema }), getTransactionsHandler);
router.post('/', validateRequest({ body: createTransactionSchema }), createTransactionHandler);
router.get(
  '/:id',
  validateRequest({ params: transactionIdParamSchema }),
  getTransactionByIdHandler
);
router.patch(
  '/:id',
  validateRequest({ params: transactionIdParamSchema, body: updateTransactionSchema }),
  updateTransactionHandler
);
router.delete(
  '/:id',
  validateRequest({ params: transactionIdParamSchema }),
  deleteTransactionHandler
);

export default router;
