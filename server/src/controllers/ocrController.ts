// server/src/controllers/ocrController.ts

// Controller handling receipt image upload, validation, and AI OCR extraction.

import { Request, Response, NextFunction } from 'express';
import { parseReceipt } from '../services/ocrService.js';
import { HttpError } from '../middlewares/errorHandler.js';

/**
 * POST /api/ocr/receipt
 * Processes an uploaded receipt image buffer and returns extracted transaction data.
 */
export const scanReceiptHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new HttpError('Receipt image file is required', 400);
    }

    const ocrData = await parseReceipt(req.file.buffer, req.file.mimetype);

    res.status(200).json({
      success: true,
      message: 'Receipt parsed successfully',
      data: ocrData,
    });
  } catch (error) {
    next(error);
  }
};
