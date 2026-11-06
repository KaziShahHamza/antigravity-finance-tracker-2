// server/src/routes/categoryRoutes.ts

// Express routes for category CRUD operations protected by JWT authentication.

import { Router } from 'express';
import {
  getCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from '../controllers/categoryController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  categoryQuerySchema,
} from '../schemas/categorySchemas.js';

const router = Router();

// Protect all category routes with JWT authentication
router.use(authenticateToken);

// Category routes
router.get('/', validateRequest({ query: categoryQuerySchema }), getCategoriesHandler);
router.post('/', validateRequest({ body: createCategorySchema }), createCategoryHandler);
router.patch(
  '/:id',
  validateRequest({ params: categoryIdParamSchema, body: updateCategorySchema }),
  updateCategoryHandler
);
router.delete('/:id', validateRequest({ params: categoryIdParamSchema }), deleteCategoryHandler);

export default router;
