import { Pool } from 'pg';
import { createCorsair, setupCorsair } from 'corsair';
import { gmail } from "@corsair-dev/gmail"
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { createVercelAiMcpClient } from "@corsair-dev/mcp"
import { generateText, isLoopFinished, stepCountIs } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

import { env } from "./env"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

//=============================================== main setup ===========================================================
export const corsair = createCorsair({
  multiTenancy: true,
  plugins: [gmail({ authType: "oauth_2" }), googlecalendar({ authType: "oauth_2" })],
  kek: process.env.CORSAIR_KEK!,
  database: pool
});

let setupPromise: Promise<string> | null = null;

export function ensureCorsairSetup() {
  setupPromise ??= setupCorsair(corsair, {
    credentials: {
      gmail: {
        client_id: env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      },
    },
  });

  return setupPromise;
}

export async function getTenant(userId: string) {
  return await corsair.withTenant(userId);
}

//========================================== mcp setup =============================================================
const googleProvider = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function chat(userId: string, message: string) {
  // 1. Get the tenant for this user
  const tenant = await getTenant(userId);

  // 2. Create the MCP client scoped to that tenant
  const client = await createVercelAiMcpClient({
    url: 'http://localhost:5000/mcp',
    // Pass tenant auth headers so the MCP server can resolve credentials

  });

  const tools = await client.tools();

  console.log('Available tools:', Object.keys(tools)); // Debug: verify tools are loaded

  const { text } = await generateText({
    model: googleProvider('gemini-2.0-flash-lite'),
    tools,
    prompt:[
      {"role":"system", "content": "summarize the email operations for yourself and satisfy user's query using the corsair's api, use user's tenantId/userId to access the api properly"},
      {"role": "user", "content": "summarize my latest mails and if cant use the tool tell me why u cant use the tool?"}
    ],
    stopWhen: isLoopFinished(),
  });

  return text;
}