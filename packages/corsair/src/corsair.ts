import { Pool } from 'pg';
import { createCorsair, setupCorsair } from 'corsair';
import { gmail } from "@corsair-dev/gmail"
import { googlecalendar } from '@corsair-dev/googlecalendar';

import { generateText, streamText, tool, isLoopFinished, type StreamTextResult, type ModelMessage } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import { withSupermemory } from "@supermemory/tools/ai-sdk"


import { env } from "./env"

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

//=============================================== main setup ===========================================================
export const corsair = createCorsair({
  multiTenancy: true,
  plugins: [gmail({ authType: "oauth_2" }), googlecalendar({ authType: "oauth_2" })],
  kek: env.CORSAIR_KEK,
  database: pool
});


let setupPromise: Promise<string> | null = null;

export function ensureCorsairSetup() {
  if (setupPromise) return setupPromise;

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

You have access to these tools:
- list_emails: Search and list emails. Use the 'q' parameter for Gmail search syntax (e.g. "is:unread", "from:alice@example.com").
- get_email: Get full details of a specific email by ID. Always call list_emails first to get IDs.
- send_email: Send an email (will be intercepted for user confirmation).
- create_draft: Create a draft email (will be intercepted for user confirmation).
- list_calendar_events: List upcoming calendar events.

When asked to summarize an email, call list_emails to find it, then get_email to read it, then summarize the content.
When asked to send an email, use send_email directly with to, subject, and body.
Always respond helpfully and concisely.`;

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

function sanitizeEmail(message: any) {
  if (!message) return null;
  const headers = message.payload?.headers || [];
  const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "";
  const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "";
  const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";

  let body = "";
  const parts = message.payload?.parts || [];

  const getBodyFromPart = (part: any): string => {
    if (part.mimeType === "text/plain" && part.body?.data) {
      try {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      } catch {
        return "";
      }
    }
    if (part.parts) {
      for (const subPart of part.parts) {
        const res = getBodyFromPart(subPart);
        if (res) return res;
      }
    }
    return "";
  };

  if (message.payload?.body?.data) {
    try {
      body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
    } catch { }
  } else {
    for (const part of parts) {
      const res = getBodyFromPart(part);
      if (res) {
        body = res;
        break;
      }
    }
  }

  return {
    id: message.id,
    threadId: message.threadId,
    from,
    subject,
    date,
    snippet: message.snippet,
    body: body.substring(0, 2000),
  };
}

/**
 * Build Vercel AI SDK tools from Corsair tool defs for a specific tenant.
 * Uses a deep proxy to intercept send/draft calls and store confirmation
 * details instead of actually sending.
 */
function buildToolsForTenant(userId: string) {
  const tenantCorsair = corsair.withTenant(userId);

  // Deep proxy to intercept send/draft calls for confirmation flow
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

              pendingConfirmations.set(userId, {
                action, to, subject, body,
                code: "",
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

  const proxiedTenant = createDeepProxy(tenantCorsair);

  return {
    list_emails: tool({
      description: "List emails from the user's Gmail inbox. Use the 'q' parameter for Gmail search queries (e.g. 'is:unread', 'from:someone@example.com', 'subject:hello').",
      parameters: z.object({
        q: z.string().optional().describe("Gmail search query"),
        maxResults: z.number().optional().describe("Max number of emails to return (default 10)"),
      }),
      execute: async ({ q, maxResults }: { q?: string; maxResults?: number }) => {
        await ensureCorsairSetup();
        const result = await proxiedTenant.gmail.api.messages.list({ q, maxResults: maxResults || 10 });
        return JSON.stringify(result);
      },
    } as any),

    get_email: tool({
      description: "Get the full details of a specific email by its message ID. Always call list_emails first to get message IDs.",
      parameters: z.object({
        id: z.string().describe("The Gmail message ID"),
      }),
      execute: async ({ id }: { id: string }) => {
        await ensureCorsairSetup();
        const result = await proxiedTenant.gmail.api.messages.get({ id });
        return JSON.stringify(sanitizeEmail(result));
      },
    } as any),

    send_email: tool({
      description: "Send an email. Construct the MIME message, base64url-encode it, and pass it as 'raw'. The system will intercept this for user confirmation before actually sending.",
      parameters: z.object({
        to: z.string().describe("Recipient email address"),
        subject: z.string().describe("Email subject"),
        body: z.string().describe("Email body text"),
      }),
      execute: async ({ to, subject, body }: { to: string; subject: string; body: string }) => {
        await ensureCorsairSetup();
        pendingConfirmations.delete(userId);
        const mime = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${body}`;
        const raw = Buffer.from(mime).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        try {
          await proxiedTenant.gmail.api.messages.send({ raw });
          return "Email sent successfully.";
        } catch (e: any) {
          // If intercepted by the proxy for confirmation
          if (e.message === "CONFIRMATION_INTERCEPTED") {
            const pending = pendingConfirmations.get(userId);
            if (pending) {
              pending.code = `const mime = \`To: ${to}\\r\\nSubject: ${subject}\\r\\nContent-Type: text/plain; charset="UTF-8"\\r\\n\\r\\n${body}\`;
const raw = Buffer.from(mime).toString("base64").replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
return await corsair.gmail.api.messages.send({ raw });`;
            }
            return "[EMAIL_CONFIRMATION_PENDING] The email has been intercepted and a preview will be shown to the user. Stop here and do not take further action.";
          }
          throw e;
        }
      },
    } as any),

    create_draft: tool({
      description: "Create a draft email in the user's Gmail.",
      parameters: z.object({
        to: z.string().describe("Recipient email address"),
        subject: z.string().describe("Email subject"),
        body: z.string().describe("Email body text"),
      }),
      execute: async ({ to, subject, body }: { to: string; subject: string; body: string }) => {
        await ensureCorsairSetup();
        pendingConfirmations.delete(userId);
        const mime = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${body}`;
        const raw = Buffer.from(mime).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        try {
          await proxiedTenant.gmail.api.drafts.create({ draft: { message: { raw } } });
          return "Draft created successfully.";
        } catch (e: any) {
          if (e.message === "CONFIRMATION_INTERCEPTED") {
            const pending = pendingConfirmations.get(userId);
            if (pending) {
              pending.code = `const mime = \`To: ${to}\\r\\nSubject: ${subject}\\r\\nContent-Type: text/plain; charset="UTF-8"\\r\\n\\r\\n${body}\`;
const raw = Buffer.from(mime).toString("base64").replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
return await corsair.gmail.api.drafts.create({ draft: { message: { raw } } });`;
            }
            return "[EMAIL_CONFIRMATION_PENDING] The draft has been intercepted and a preview will be shown to the user.";
          }
          throw e;
        }
      },
    } as any),

    list_calendar_events: tool({
      description: "List upcoming events from the user's Google Calendar.",
      parameters: z.object({
        calendarId: z.string().optional().describe("Calendar ID (default: 'primary')"),
      }),
      execute: async ({ calendarId }: { calendarId?: string }) => {
        await ensureCorsairSetup();
        const result = await proxiedTenant.googlecalendar.api.events.list({ calendarId: calendarId || "primary" });
        return JSON.stringify(result);
      },
    } as any),
  };
}

function getModelForTenant(userId: string) {
  const baseModel = googleProvider("gemini-2.5-flash-lite");
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
  pendingConfirmations.delete(userId);

  const tools = buildToolsForTenant(userId);

  const options: any = {
    model: getModelForTenant(userId),
    tools,
    system: SYSTEM_PROMPT,
    maxSteps: 5,
    stopWhen: isLoopFinished(),
  };

  if (typeof messageOrHistory === "string") {
    options.prompt = messageOrHistory;
  } else {
    options.messages = messageOrHistory;
  }

  const result = await generateText(options);

  // After generateText completes, check if a confirmation was intercepted
  const pending = pendingConfirmations.get(userId);
  if (pending) {
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

  return result.text;
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
    stopWhen: isLoopFinished(),
  });
}