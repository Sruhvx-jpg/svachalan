// pnpm packages
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateOAuthUrl, processOAuthCallback } from "corsair/oauth";

// in house modules
import { corsair, ensureCorsairSetup } from "@repo/corsair"

// current working directory files
import { router, TokenBasedProcedure } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  connectEmailInputModel,
  connectEmailOutputModel,
  callbackInputModel,
  callbackOutputModel
} from "./model";
import { setupCorsair } from "corsair";
import db, { eq } from "../../../../database";
import { integratedToolsTable, usersTable } from "../../../../database/schema";

const TAGS = ["CorsairGoogleIntegrateOAuth"];
const getPath = generatePath("Dashboard");
const APP_URL = "http://localhost:3000"
const OAUTH_CALLBACK_URL = `${APP_URL}/api/auth/callback`

export const CorsairGoogleIntegrateOAuth = router({

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

        console.log(plugin)
        const { url, state } = await generateOAuthUrl(corsair, plugin, {
          tenantId: userId,
          redirectUri: OAUTH_CALLBACK_URL,
        })

        if (!url || !state) {
          throw new Error(`Failed to generate OAuth URL for plugin: ${plugin}`)
        }

        return { url, state, plugin }
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

        await db
          .insert(integratedToolsTable)
          .values({
            userId,
          })
          .onConflictDoNothing();


        const result = await processOAuthCallback(corsair, { // <--- this function stores acc and ref token in config column
          code,
          state,
          redirectUri: OAUTH_CALLBACK_URL,
        })

        const integrationName = plugin
        console.log("=============== ", integrationName, " =====================")
        await db
          .update(integratedToolsTable)
          .set({
            [integrationName]: true,
          })
          .where(eq(integratedToolsTable.userId, userId));

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

checkAllIntegratedToolStatus: TokenBasedProcedure.meta({
    openapi: { method: 'GET', path: getPath("CheckAllIntegratedToolStatus"), tags: TAGS }
  })
  .output(z.record(z.string(), z.boolean()))
  .query(async ({ ctx }) => {
    try {
      const userId = ctx.user.sub;

      const [record] = await db
        .select()
        .from(integratedToolsTable)
        .where(eq(integratedToolsTable.userId, userId));


      if (!record) {
        return {};
      }


      const { userId: _, ...integrationStatuses } = record;

      // Coerce all values to boolean to ensure safety
      const statusMap: Record<string, boolean> = {};
      for (const [key, value] of Object.entries(integrationStatuses)) {
        statusMap[key] = !!value;
      }

      return statusMap;

    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch integration statuses",
      });
    }
  }),

  //end
})