// server/src/routes/userRoutes.ts

// Express router exposing endpoints for user profile management, password updates, and demo data initialization.

import { Router } from 'express';
import {
  getMe,
  loadDemoData,
  updatePassword,
  updateProfile,
} from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { updatePasswordSchema, updateProfileSchema } from '../schemas/userSchemas.js';

const router = Router();

// All user routes require a valid access token
router.use(authenticateToken);

router.get('/me', getMe);
router.patch('/profile', validateRequest({ body: updateProfileSchema }), updateProfile);
router.patch('/password', validateRequest({ body: updatePasswordSchema }), updatePassword);
router.post('/demo-data', loadDemoData);

export default router;
