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

  //==================================================== connect email =============================================
  connectEmail: TokenBasedProcedure.meta({
    openapi: {
      method: "POST", path: getPath("connect"), tags: TAGS,
    }
  })
    .input(connectEmailInputModel)
    .output(connectEmailOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {

        const { plugin } = input
        const tenantId = ctx.user.sub

        await ensureCorsairSetup()

        // Generate OAuth URL
        const { url, state } = await generateOAuthUrl(corsair, plugin, {
          tenantId,
          redirectUri: OAUTH_CALLBACK_URL,
        })

        await setupCorsair(corsair, {
          tenantId: tenantId,
        });



        if (!url || !state) {
          throw new Error(`Failed to generate OAuth URL for plugin: ${plugin}`)
        }

        // Return URL and state - state will be stored in secure cookie by frontend
        return { url, state }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "connect email route failed",
        });
      }
    }),

  //==================================================== oauth callback =============================================
  oauthCallback: TokenBasedProcedure.meta({
    openapi: {
      method: "POST", path: getPath("oauthCallback"), tags: TAGS,
    }
  })
    .input(callbackInputModel)
    .output(callbackOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        const { code, state, plugin, access_token, refresh_token } = input

        // Verify state parameter (frontend should validate and pass it)
        // In a real implementation, validate state from a temporary store

        await ensureCorsairSetup()
        console.log(input)

        const result = await processOAuthCallback(corsair, {
          code,
          state,
          redirectUri: OAUTH_CALLBACK_URL,
        })
        console.log("result: ", result)




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

  //==================================================== list emails =============================================
  listEmails: TokenBasedProcedure.meta({
    openapi: {
      method: "GET", path: getPath("List"), tags: TAGS,
    },
  }).input(listEmailsInputModel).output(listEmailsOutputModel).query(async ({ input, ctx }) => {
    try {
      const { limit, offset } = input

      const payload = {
        userId: ctx.user.sub,
        limit,
        offset
      }

      const emails = await emailService.listEmails(payload);

      return { emails };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "list emails route failed",
      });
    }
  }),

  //==================================================== dashboard stats =============================================
  getDashboardStats: TokenBasedProcedure.meta({
    openapi: {
      method: "GET", path: getPath("Stats"), tags: TAGS,
    },
  }).input(z.void()).output(dashboardStatsOutputModel).query(async ({ ctx }) => {
    try {
      const stats = await emailService.getDashboardStats(ctx.user.sub);

      return stats;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "get dashboard stats route failed",
      });
    }
  }),

  //==================================================== sync emails =============================================
  syncEmails: TokenBasedProcedure.meta({
    openapi: {
      method: "POST", path: getPath("Sync"), tags: TAGS,
    },
  }).input(z.void()).output(syncOutputModel).mutation(async ({ ctx }) => {
    try {
      const result = await emailService.SyncEmails(ctx.user.sub);

      return result;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "sync emails route failed",
      });
    }
  }),

  //==================================================== connection status =============================================
  getConnectionStatus: TokenBasedProcedure.meta({
    openapi: {
      method: "GET", path: getPath("ConnectionStatus"), tags: TAGS,
    },
  }).input(z.void()).output(connectionStatusOutputModel).query(async ({ ctx }) => {
    try {
      const status = await emailService.GetConnectionStatus(ctx.user.sub);

      return status;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "get connection status route failed",
      });
    }
  }),
});
