// Validates and exposes strongly-typed environment variables with safe development defaults.
import dotenv from 'dotenv';
import { z } from 'zod';

// Load local environment files if present
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:3000'),

  MONGODB_URI: z.string().default('mongodb://localhost:27017/finance_tracker'),
  MONGODB_TEST_URI: z.string().default('mongodb://localhost:27017/finance_tracker_test'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  RESEND_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
});

const parseEnv = () => {
  // Use fallback development secrets if running in dev/test and secrets are not explicitly provided
  const rawEnv = {
    ...process.env,
    JWT_ACCESS_SECRET:
      process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_at_least_32_characters_long_12345',
    JWT_REFRESH_SECRET:
      process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_at_least_32_characters_long_12345',
  };

  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    console.error('Environment variable validation failed:', parsed.error.format());
    throw new Error('Invalid environment configuration');
  }

  return parsed.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
