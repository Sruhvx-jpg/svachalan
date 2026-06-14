import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config"

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env";
import { createBaseMcpServer, createMcpRouter } from "@corsair-dev/mcp";
import {corsair} from "@repo/corsair"

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Svachalan OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
})

// Configure CORS - accept from everywhere
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "trpc-accept"],
  }),
);

app.use(cookieParser());
app.use(express.json())

app.get("/", (req, res) => {
  return res.json({ message: " is up and running..." });
})

app.use('/mcp', createMcpRouter(() => createBaseMcpServer({ corsair})))

app.get("/health", (req, res) => {
  return res.json({ message: "Svachalan server is healthy", healthy: true });
})

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
})

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
)

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
)

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
})

app.listen(5000, ()=> console.log("MCP server is running on port 4000"))

// global error handlers
app.use((err: any, req: any, res: any, next: any) => {
  logger.error("Error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
})



export default app;
