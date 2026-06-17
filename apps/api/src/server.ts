import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import * as trpcExpress from "@trpc/server/adapters/express";
import {
  generateOpenApiDocument,
  createOpenApiExpressMiddleware,
} from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env";
import { corsair, ensureCorsairSetup } from "@repo/corsair";
import { createBaseMcpServer, createMcpRouter } from "@corsair-dev/mcp";
import { verifyAccTok } from "@repo/utils"; // <-- wherever yours lives
import { streamChat } from "@repo/corsair/src/corsair";

export const app = express();

// Run Corsair setup on startup
ensureCorsairSetup().catch((err) => {
  logger.error("Failed to run ensureCorsairSetup on server startup:", err);
});

const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Svachalan OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "mcp-session-id",
      "trpc-accept",
    ],
  }),
);

app.use(cookieParser());
app.use(express.json());

app.get("/", (_, res) => {
  res.json({ message: "is up and running..." });
});

/* ================= MCP AUTH ================= */

const mcpAuth = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Access token missing",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const payload = verifyAccTok(token);

    req.user = payload;

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired access token",
    });
  }
};

/* ================= MCP ================= */

app.use("/mcp", mcpAuth, (req: any, res: any, next: any) => {
  const userId = req.user.userId;

  return createMcpRouter(() =>
    createBaseMcpServer({
      corsair: corsair.withTenant(userId),
    })
  )(req, res, next);
});

/* ================= STREAMING AI CHAT ================= */

app.post("/api/ai/chat/stream", async (req: any, res: any) => {
  try {
    // authenticate via cookie (same as tRPC middleware)
    const token = req.cookies?.authentication_token;

    if (!token) {
      return res.status(401).json({ error: "Access token missing" });
    }

    const payload = verifyAccTok(token);
    const userId = payload.sub;
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const result = streamChat(message, userId);

    // pipe the Vercel AI SDK data stream directly to the response
    result.pipeDataStreamToResponse(res);
  } catch (error) {
    logger.error("Streaming chat error:", error);

    // only send error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
});

/* ================= HEALTH ================= */

app.get("/health", (_, res) => {
  res.json({
    message: "Svachalan server is healthy",
    healthy: true,
  });
});

/* ================= OPENAPI ================= */

app.get("/openapi.json", (_, res) => {
  res.json(openApiDocument);
});

app.use("/docs", apiReference({ url: "/openapi.json" }));

/* ================= API ================= */

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

/* ================= ERRORS ================= */

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: any, req: any, res: any, next: any) => {
  logger.error("Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

export default app;