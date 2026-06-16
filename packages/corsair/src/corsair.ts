import { Pool } from 'pg';
import { createCorsair, setupCorsair } from 'corsair';
import { gmail } from "@corsair-dev/gmail"
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { buildCorsairToolDefs } from "@corsair-dev/mcp"
import { generateText, streamText, stepCountIs, zodSchema, type ToolSet, type StreamTextResult } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"


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
  setupPromise = setupCorsair(corsair, {
    credentials: {
      gmail: {
        client_id: env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      },
      googlecalendar: {
        client_id: env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      }
    },
  });

  return setupPromise;
}

export async function getTenant(userId: string) {
  return await corsair.withTenant(userId);
}

//========================================== AI chat (direct tool invocation) ===========================================

const SYSTEM_PROMPT = `You are an intelligent email assistant with access to the user's Gmail inbox and Google Calendar.
You can help the user:
- Read and search their emails
- Get summaries of their inbox
- Find specific emails by sender, subject, or content
- Mark emails as read
- Send emails on their behalf
- View and manage calendar events

Always use Corsair tools to interact with Gmail and Google Calendar.
Start with list_operations to discover what's available, use get_schema for parameters, then run_script to execute.
When referencing emails, use their ID, not subject lines.
Be concise and helpful. If an action could be destructive (delete, send), confirm with the user first.`

const googleProvider = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
});

/**
 * Build Vercel AI SDK tools from Corsair tool defs for a specific tenant.
 * This bypasses the HTTP MCP transport entirely — no session, no SSE, no roundtrip.
 */
function buildToolsForTenant(userId: string): ToolSet {
  const tenantCorsair = corsair.withTenant(userId)
  const corsairDefs = buildCorsairToolDefs({ corsair: tenantCorsair as any })

  // Convert CorsairToolDef[] → Vercel AI SDK ToolSet format
  const tools: ToolSet = {}
  for (const def of corsairDefs) {
    // Build a Zod object from the CorsairToolDef's shape
    const inputSchema = zodSchema(z.object(def.shape as any))

    tools[def.name] = {
      description: def.description,
      inputSchema,
      execute: async (args: Record<string, unknown>) => {
        const result = await def.handler(args)
        // Extract text content from MCP CallToolResult
        return result.content
          .filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("\n")
      },
    }
  }

  return tools
}

/**
 * Non-streaming chat — returns the final text response.
 */
export async function chat(message: string, userId: string): Promise<string> {
  const tools = buildToolsForTenant(userId)


  const { text } = await generateText({
    model: googleProvider("gemma-4-31b-it"),
    tools,
    stopWhen: stepCountIs(10),
    system: SYSTEM_PROMPT,
    prompt: message,
  })

  console.log(text)

  return text
}

/**
 * Streaming chat — returns the streamText result for piping to SSE.
 */
export function streamChat(message: string, userId: string): StreamTextResult<any, any> {
  const tools = buildToolsForTenant(userId)

  return streamText({
    model: googleProvider("gemini-2.0-flash"),
    tools,
    stopWhen: stepCountIs(10),
    system: SYSTEM_PROMPT,
    prompt: message,
  })
}