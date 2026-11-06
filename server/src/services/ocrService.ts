// server/src/services/ocrService.ts

// AI receipt scanning service integrating Gemini Vision OCR, Cloudinary uploads, and deterministic dev fallbacks.

import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { roundCurrency } from '../utils/mathUtils.js';

export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface ReceiptOcrResult {
  vendor: string;
  date: string;
  totalAmount: number;
  currency: string;
  suggestedCategory: string;
  items: ReceiptItem[];
  receiptUrl: string;
  isMock?: boolean;
}

/**
 * Uploads a receipt image buffer to Cloudinary if credentials are provided,
 * otherwise falls back to a base64 Data URI or preview placeholder.
 */
export const uploadReceiptImage = async (buffer: Buffer, mimetype: string): Promise<string> => {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    return new Promise((resolve, _reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'finance-tracker/receipts',
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            console.warn('[Cloudinary] Upload failed, falling back to data URL:', error?.message);
            resolve(`data:${mimetype};base64,${buffer.toString('base64')}`);
          } else {
            resolve(result.secure_url);
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  // Fallback: return base64 Data URI for local inspection
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
};

/**
 * Parses a receipt image using Gemini Vision or returns deterministic mock data if unconfigured.
 */
export const parseReceipt = async (buffer: Buffer, mimetype: string): Promise<ReceiptOcrResult> => {
  const receiptUrl = await uploadReceiptImage(buffer, mimetype);

  // If Gemini API Key is configured, attempt live multimodal extraction
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      const prompt = `Analyze this receipt image and extract structured data in JSON format matching this exact schema:
{
  "vendor": "Merchant or store name",
  "date": "YYYY-MM-DD",
  "totalAmount": 12.34,
  "currency": "3-letter uppercase currency code like USD, BDT, EUR",
  "suggestedCategory": "One of: Food & Dining, Rent & Housing, Groceries, Shopping, Transportation, Utilities, Entertainment, Health, Other",
  "items": [
    { "name": "Item description", "price": 1.23, "quantity": 1 }
  ]
}
Return only valid JSON. Do not include markdown codeblocks or extra explanations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimetype,
                  data: buffer.toString('base64'),
                },
              },
            ],
          },
        ],
      });

      const text = response.text || '';
      const cleanJson = text
        .replace(/```(?:json)?/g, '')
        .replace(/```/g, '')
        .trim();
      const parsed = JSON.parse(cleanJson);

      return {
        vendor: typeof parsed.vendor === 'string' ? parsed.vendor.trim() : 'Unknown Vendor',
        date: parsed.date || new Date().toISOString().split('T')[0],
        totalAmount: roundCurrency(Number(parsed.totalAmount) || 0),
        currency: (parsed.currency || 'USD').toUpperCase().trim(),
        suggestedCategory: parsed.suggestedCategory || 'Other',
        items: Array.isArray(parsed.items)
          ? parsed.items.map((item: Record<string, unknown>) => ({
              name: String(item.name || 'Item'),
              price: roundCurrency(Number(item.price) || 0),
              quantity: Number(item.quantity) || 1,
            }))
          : [],
        receiptUrl,
        isMock: false,
      };
    } catch (error) {
      console.warn(
        '[OCR] Gemini Vision extraction error, falling back to mock OCR data:',
        (error as Error).message
      );
    }
  } else {
    console.info('[OCR] GEMINI_API_KEY omitted, returning realistic mock OCR fallback data.');
  }

  // Deterministic local mock fallback (per AGENTS.md Section 4)
  return {
    vendor: 'Supermarket Fresh Mart',
    date: new Date().toISOString().split('T')[0],
    totalAmount: 47.85,
    currency: 'USD',
    suggestedCategory: 'Groceries',
    items: [
      { name: 'Organic Milk 1 Gallon', price: 4.99, quantity: 1 },
      { name: 'Whole Wheat Bread', price: 3.49, quantity: 1 },
      { name: 'Fresh Gala Apples 2lb', price: 5.99, quantity: 1 },
      { name: 'Chicken Breast Cutlets', price: 16.5, quantity: 1 },
      { name: 'Greek Yogurt 4-Pack', price: 6.88, quantity: 1 },
      { name: 'Avocados (Bag of 4)', price: 4.99, quantity: 1 },
      { name: 'Sales Tax', price: 5.01, quantity: 1 },
    ],
    receiptUrl,
    isMock: true,
  };
};
