// server/src/routes/dashboardRoutes.ts

// Express routes for dashboard analytics, KPI summaries, and chart data feeds.

import { Router } from 'express';
import { getDashboardSummaryHandler } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect all dashboard endpoints with JWT authentication
router.use(authenticateToken);

router.get('/summary', getDashboardSummaryHandler);

export default router;
