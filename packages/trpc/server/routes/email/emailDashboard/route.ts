// pnpm packages
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// in house modules
import { emailService } from "../../../services"
import { corsair } from "@repo/corsair"

// current working directory files
import { router, TokenBasedProcedure } from "../../../trpc";
import { generatePath } from "../../../utils/path-generator";
import {
  listEmailsInputModel,
  connectionStatusOutputModel,
  dashboardStatsOutputModel,
  listEmailsOutputModel,
  syncOutputModel,
  searchEmailsInputModel,
  searchEmailsOutputModel,
  getEmailByIdInputModel,
  getEmailByIdOutputModel,
} from "./model";
import { setupCorsair } from "corsair";

const TAGS = ["Email"];
const getPath = generatePath("Dashboard");
const APP_URL = "http://localhost:3000"
const OAUTH_CALLBACK_URL = `${APP_URL}/api/auth/callback`

export const emailRouter = router({
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

  searchEmails: TokenBasedProcedure.meta({
    openapi: { method: "POST", path: getPath("Search"), tags: TAGS },
  })
    .input(searchEmailsInputModel)
    .output(searchEmailsOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        const { query, maxResults } = input;
        const emails = await emailService.searchEmails(
          ctx.user.sub,
          query,
          maxResults,
        );
        return { emails };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "search emails route failed",
        });
      }
    }),

  getEmailById: TokenBasedProcedure.meta({
    openapi: { method: "GET", path: getPath("GetById"), tags: TAGS },
  })
    .input(getEmailByIdInputModel)
    .output(getEmailByIdOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        return await emailService.getEmailById(ctx.user.sub, input.emailId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "get email by id route failed",
        });
      }
    }),
});