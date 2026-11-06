// server/src/routes/ratesRoutes.ts

// Express route for fetching live or cached multi-currency exchange rates.

import { Router, Request, Response, NextFunction } from 'express';
import { getExchangeRates } from '../services/ratesService.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';

const router = Router();

/**
 * GET /api/rates
 * Returns foreign exchange rates against USD, including user custom rate overrides if authenticated.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let userId: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = verifyAccessToken(token);
        userId = payload.userId;
      } catch {
        // Continue unauthenticated if token expired or invalid for public rates
      }
    }

    const ratesData = await getExchangeRates(userId);

    res.status(200).json({
      success: true,
      data: ratesData,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
