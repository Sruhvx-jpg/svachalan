import { Pool } from 'pg';
import { createCorsair, setupCorsair } from 'corsair';
import { gmail } from "@corsair-dev/gmail"
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { buildCorsairToolDefs } from "@corsair-dev/mcp"
import { generateText, streamText, zodSchema, type ToolSet, type StreamTextResult, type ModelMessage } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import { withSupermemory } from "@supermemory/tools/ai-sdk"


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

import { Kysely } from "kysely";

let setupPromise: Promise<string> | null = null;

export function ensureCorsairSetup() {
  if (setupPromise) return setupPromise;

  console.log("[corsair-debug] kek:", typeof corsair.kek, corsair.kek ? corsair.kek.substring(0, 5) + "..." : "undefined");
  console.log("[corsair-debug] plugins:", Array.isArray(corsair.plugins) ? corsair.plugins.length : "not array");
  console.log("[corsair-debug] database:", !!corsair.database);
  console.log("[corsair-debug] database.db:", corsair.database?.db ? corsair.database.db.constructor?.name : "undefined");
  console.log("[corsair-debug] database.db instanceof Kysely:", corsair.database?.db instanceof Kysely);

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
  await ensureCorsairSetup();
  return await corsair.withTenant(userId);
}

//========================================== AI chat (direct tool invocation) ===========================================

const SYSTEM_PROMPT = `You are an intelligent email assistant with access to the user's Gmail inbox and Google Calendar.
You also have persistent long-term memory. Information the user has previously told you (names, email addresses, preferences, etc.) may be included in this system prompt as "User Supermemories". ALWAYS check this context FIRST before using any tools. If the answer is already in your memory context, respond directly without calling tools.

You have access to the following APIs via the \`corsair\` object:
- \`corsair.gmail.api.messages.list({ q?: string, maxResults?: number })\`: List messages.
- \`corsair.gmail.api.messages.get({ id: string })\`: Get details of a single message.
- \`corsair.gmail.api.messages.send({ raw: string })\`: Send a new email.
- \`corsair.gmail.api.drafts.create({ draft: { message: { raw: string } } })\`: Create a draft email.
- \`corsair.gmail.api.messages.delete({ id: string })\`: Delete a message.
- \`corsair.googlecalendar.api.events.list({ calendarId?: string })\`: List calendar events.

To send or draft an email, you must:
1. Construct the email in standard RFC 2822 MIME format (including To, Subject, Content-Type: text/plain; charset="UTF-8", etc.).
2. Base64url-encode the MIME email body in JavaScript:
   Buffer.from(mime).toString("base64").replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "")
3. Write a JavaScript snippet calling the send or draft API on the \`corsair\` object.
4. Execute it using the \`run_script\` tool.

Example script to send an email:
const to = "recipient@example.com";
const subject = "Hello";
const body = "This is the body.";
const mime = \`To: \${to}\\r\\nSubject: \${subject}\\r\\nContent-Type: text/plain; charset="UTF-8"\\r\\n\\r\\n\${body}\`;
const base64url = Buffer.from(mime).toString("base64").replace(/\\\\+/g, "-").replace(/\\\\//g, "_").replace(/=+$/, "");
return await corsair.gmail.api.messages.send({ raw: base64url });

You MUST invoke the \`run_script\` tool immediately when asked to send, draft, list, or get emails/events. Do not describe the action or ask for verbal confirmation beforehand. The system interface will automatically intercept your tool call, decode the MIME message, and present a secure confirmation preview to the user.`;

const googleProvider = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
});

function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

function parseMimeMessage(mimeText: string) {
  const lines = mimeText.split(/\r?\n/);
  let to = "";
  let subject = "";
  let bodyLines: string[] = [];
  let inHeaders = true;

  for (const line of lines) {
    if (inHeaders) {
      if (line.trim() === "") {
        inHeaders = false;
        continue;
      }
      const lower = line.toLowerCase();
      if (lower.startsWith("to:")) {
        to = line.substring(3).trim();
      } else if (lower.startsWith("subject:")) {
        subject = line.substring(8).trim();
      }
    } else {
      bodyLines.push(line);
    }
  }

  return {
    to,
    subject,
    body: bodyLines.join("\n").trim(),
  };
}

// Module-level map to store pending confirmations per user
const pendingConfirmations = new Map<string, {
  action: "send" | "draft";
  to: string;
  subject: string;
  body: string;
  code: string;
}>();

/**
 * Build Vercel AI SDK tools from Corsair tool defs for a specific tenant.
 * Uses a deep proxy to intercept send/draft calls and store confirmation
 * details instead of actually sending.
 */
function buildToolsForTenant(userId: string): ToolSet {
  const tenantCorsair = corsair.withTenant(userId);

  const createDeepProxy = (target: any, path: string[] = []): any => {
    return new Proxy(target, {
      get(target, prop, receiver) {
        const currentPath = [...path, String(prop)];
        const value = Reflect.get(target, prop, receiver);

        if (typeof value === "function") {
          return function (this: any, ...args: any[]) {
            const pathStr = currentPath.join(".");
            const lowerPath = pathStr.toLowerCase();
            if (
              lowerPath.endsWith("messages.send") ||
              lowerPath.endsWith("drafts.create") ||
              lowerPath.endsWith("drafts.send")
            ) {
              const action = lowerPath.endsWith("drafts.create") ? "draft" : "send";
              let raw = "";
              const params = args[0] || {};
              if (lowerPath.endsWith("messages.send")) {
                raw = params.raw || params.requestBody?.raw || params.resource?.raw || "";
              } else if (lowerPath.endsWith("drafts.create")) {
                raw = params.draft?.message?.raw || params.requestBody?.message?.raw || params.resource?.message?.raw || "";
              } else if (lowerPath.endsWith("drafts.send")) {
                raw = params.message?.raw || params.requestBody?.message?.raw || "";
              }

              // Decode and store
              let to = "", subject = "", body = "";
              try {
                if (raw) {
                  const mimeText = decodeBase64Url(raw);
                  const parsed = parseMimeMessage(mimeText);
                  to = parsed.to;
                  subject = parsed.subject;
                  body = parsed.body;
                }
              } catch (e) {
                console.error("Failed to decode MIME in proxy:", e);
              }

              // Store as a pending confirmation — throw to abort the script
              pendingConfirmations.set(userId, {
                action, to, subject, body,
                code: "", // will be set in execute wrapper
              });
              throw new Error("CONFIRMATION_INTERCEPTED");
            }
            return value.apply(this, args);
          };
        }

        if (value && typeof value === "object") {
          return createDeepProxy(value, currentPath);
        }

        return value;
      },
    });
  };

  const proxyCorsair = createDeepProxy(tenantCorsair);
  const corsairDefs = buildCorsairToolDefs({ corsair: proxyCorsair as any });

  const tools: ToolSet = {};
  for (const def of corsairDefs) {
    const inputSchema = zodSchema(z.object(def.shape as any));

    tools[def.name] = {
      description: def.description,
      inputSchema,
      execute: async (args: Record<string, unknown>) => {
        await ensureCorsairSetup();
        // Clear any stale confirmation before running
        pendingConfirmations.delete(userId);

        const result = await def.handler(args);

        // Check if the proxy intercepted a send/draft call
        const pending = pendingConfirmations.get(userId);
        if (pending) {
          // Store the code that was used so we can re-execute after approval
          pending.code = (args.code as string) || "";
          // Return a stop message — DON'T throw (throwing makes the SDK retry)
          return "[EMAIL_CONFIRMATION_PENDING] The email has been intercepted and a preview will be shown to the user. Stop here and do not take further action.";
        }

        // Normal tool result
        return result.content
          .filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("\n");
      },
    };
  }

  return tools;
}

function getModelForTenant(userId: string) {
  const baseModel = googleProvider("gemma-4-31b-it");
  if (env.SUPERMEMORY_API_KEY) {
    return withSupermemory(baseModel, {
      containerTag: userId,
      customId: "general",
      mode: "full",
      apiKey: env.SUPERMEMORY_API_KEY,
      baseUrl: env.SUPERMEMORY_BASE_URL || "https://api.supermemory.ai",
    });
  }
  return baseModel;
}



/**
 * Non-streaming chat — returns the final text response OR throws
 * ConfirmationRequiredError if a send/draft was intercepted.
 */
export async function chat(messageOrHistory: string | ModelMessage[], userId: string): Promise<string> {
  await ensureCorsairSetup();
  // Clear any stale pending confirmation
  pendingConfirmations.delete(userId);

  const tools = buildToolsForTenant(userId);

  const options: any = {
    model: getModelForTenant(userId),
    tools,
    system: SYSTEM_PROMPT,
  };

  if (typeof messageOrHistory === "string") {
    options.prompt = messageOrHistory;
  } else {
    options.messages = messageOrHistory;
  }

  const { text } = await generateText(options);

  // After generateText completes, check if a confirmation was intercepted
  const pending = pendingConfirmations.get(userId);
  if (pending) {
    // Don't delete yet — the service layer will store it
    throw new Error(
      "ConfirmationRequiredError: " +
      JSON.stringify({
        action: pending.action,
        to: pending.to || "unknown",
        subject: pending.subject || "No Subject",
        body: pending.body || "No Content",
        code: pending.code,
      }),
    );
  }

  return text;
}


/**
 * Streaming chat — returns the streamText result for piping to SSE.
 */
export function streamChat(message: string, userId: string): StreamTextResult<any, any> {
  const tools = buildToolsForTenant(userId);

  return streamText({
    model: getModelForTenant(userId),
    tools,
    system: SYSTEM_PROMPT,
    prompt: message,
  });
}