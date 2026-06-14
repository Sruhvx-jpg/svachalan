// pnpm packages
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateOAuthUrl, processOAuthCallback } from "corsair/oauth";

// in house modules
import { emailService } from "../../../services"
import { corsair, ensureCorsairSetup } from "@repo/corsair"

// current working directory files
import { publicProcedure, router, TokenBasedProcedure } from "../../../trpc";
import { generatePath } from "../../../utils/path-generator";
import {
  listEmailsInputModel,
  connectionStatusOutputModel,
  dashboardStatsOutputModel,
  listEmailsOutputModel,
  syncOutputModel,
  connectEmailInputModel,
  connectEmailOutputModel,
  callbackInputModel,
  callbackOutputModel
} from "./model";
import { setupCorsair } from "corsair";

const TAGS = ["Email"];
const getPath = generatePath("Dashboard");
const APP_URL = "http://localhost:3000"
const OAUTH_CALLBACK_URL = `${APP_URL}/api/auth/callback`

export const emailRouter = router({

  connectEmail: TokenBasedProcedure.meta({
    openapi: { method: "POST", path: getPath("connect"), tags: TAGS }
  })
    .input(connectEmailInputModel)
    .output(connectEmailOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        const { plugin } = input
        const userId = ctx.user.sub

        await ensureCorsairSetup()
        await setupCorsair(corsair, { tenantId: userId }) // <-- this function makes the corsair_account with tenantid only

        const { url, state } = await generateOAuthUrl(corsair, plugin, {
          tenantId: userId,
          redirectUri: OAUTH_CALLBACK_URL,
        })

        if (!url || !state) {
          throw new Error(`Failed to generate OAuth URL for plugin: ${plugin}`)
        }

        return { url, state }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "connect email route failed",
        });
      }
    }),

  oauthCallback: TokenBasedProcedure.meta({
    openapi: { method: "POST", path: getPath("oauthCallback"), tags: TAGS }
  })
    .input(callbackInputModel)
    .output(callbackOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        const { code, state, plugin } = input
        const userId = ctx.user.sub

        await ensureCorsairSetup()

        const result = await processOAuthCallback(corsair, { // <--- this function stores acc and ref token in config column
          code,
          state,
          redirectUri: OAUTH_CALLBACK_URL,
        })

        // ✅ Seed the DB right after OAuth completes
        const tenant = await corsair.withTenant(userId)
        await tenant.gmail.api.messages.list({ maxResults: 100 })

        return {
          success: true,
          message: `Successfully connected ${result.plugin || plugin} account`,
        }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "oauth callback route failed",
        });
      }
    }),

  // ✅ GET + query (was GET + mutation)
  listEmails: TokenBasedProcedure.meta({
    openapi: { method: "GET", path: getPath("List"), tags: TAGS },
  })
    .input(listEmailsInputModel)
    .output(listEmailsOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        const { limit, offset } = input
        const emails = await emailService.listEmails({
          userId: ctx.user.sub,
          limit,
          offset,
        });
        return { emails };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "list emails route failed",
        });
      }
    }),

  getDashboardStats: TokenBasedProcedure.meta({
    openapi: { method: "GET", path: getPath("Stats"), tags: TAGS },
  })
    .input(z.void())
    .output(dashboardStatsOutputModel)
    .query(async ({ ctx }) => {
      try {
        return await emailService.getDashboardStats(ctx.user.sub);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "get dashboard stats route failed",
        });
      }
    }),

  // ✅ GET + query (was GET + mutation)
  syncEmails: TokenBasedProcedure.meta({
    openapi: { method: "GET", path: getPath("Sync"), tags: TAGS },
  })
    .input(z.void())
    .output(syncOutputModel)
    .query(async ({ ctx }) => {
      try {
        return await emailService.SyncEmails(ctx.user.sub);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "sync emails route failed",
        });
      }
    }),

  getConnectionStatus: TokenBasedProcedure.meta({
    openapi: { method: "GET", path: getPath("ConnectionStatus"), tags: TAGS },
  })
    .input(z.void())
    .output(connectionStatusOutputModel)
    .query(async ({ ctx }) => {
      try {
        return await emailService.GetConnectionStatus(ctx.user.sub);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "get connection status route failed",
        });
      }
    }),
});