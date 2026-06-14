// @repo/config/env.ts (or similar)
import { z } from 'zod';
import 'dotenv/config'

const envSchema = z.object({
  GOOGLE_OAUTH_CLIENT_ID: z.string(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string()
  // Add other required vars here
});


export const env = envSchema.parse(process.env);