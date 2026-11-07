// server/src/routes/budgetRoutes.ts

// Express routes for category-based budget creation, progress tracking, updates, and deletion.

import { Router } from 'express';
import { z } from 'zod';
import {
  getBudgetsHandler,
  createBudgetHandler,
  updateBudgetHandler,
  deleteBudgetHandler,
} from '../controllers/budgetController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
  getBudgetsQuerySchema,
} from '../schemas/budgetSchemas.js';

const budgetIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid budget ID format'),
});

const router = Router();

// Protect all budget endpoints with JWT authentication
router.use(authenticateToken);

router.get('/', validateRequest({ query: getBudgetsQuerySchema }), getBudgetsHandler);
router.post('/', validateRequest({ body: createBudgetSchema }), createBudgetHandler);
router.patch(
  '/:id',
  validateRequest({ params: budgetIdParamSchema, body: updateBudgetSchema }),
  updateBudgetHandler
);
router.delete('/:id', validateRequest({ params: budgetIdParamSchema }), deleteBudgetHandler);

export default router;
