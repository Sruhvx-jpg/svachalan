// @repo/config/env.ts (or similar)
import { z } from 'zod';
import 'dotenv/config'

const envSchema = z.object({
  GOOGLE_OAUTH_CLIENT_ID: z.string(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
  SUPERMEMORY_API_KEY: z.string().optional(),
  SUPERMEMORY_BASE_URL: z.string().optional(),
  CORSAIR_KEK: z.string().min(1, "CORSAIR_KEK is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required")
});

export const env = envSchema.parse(process.env);