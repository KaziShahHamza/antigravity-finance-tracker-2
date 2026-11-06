// server/src/routes/ocrRoutes.ts

// Express routes for receipt image upload and AI OCR processing.

import { Router } from 'express';
import multer from 'multer';
import { scanReceiptHandler } from '../controllers/ocrController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { ocrLimiter } from '../middlewares/rateLimiters.js';
import { HttpError } from '../middlewares/errorHandler.js';

const router = Router();

// Configure Multer in-memory storage with Render 512MB RAM guardrail (5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400));
    }
  },
});

// Protect all OCR endpoints with JWT authentication and rate limiting
router.use(authenticateToken);
router.use(ocrLimiter);

router.post('/receipt', upload.single('receipt'), scanReceiptHandler);

export default router;
