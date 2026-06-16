// pnpm packages
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// in house modules
import { calendarService } from "../../../services";

// current working directory files
import { router, TokenBasedProcedure } from "../../../trpc";
import { generatePath } from "../../../utils/path-generator";
import {
  listEventsInputModel,
  listEventsOutputModel,
  calendarStatsOutputModel,
  getEventByIdInputModel,
  getEventByIdOutputModel,
  createEventInputModel,
  createEventOutputModel,
  updateEventInputModel,
  updateEventOutputModel,
  deleteEventInputModel,
  deleteEventOutputModel,
  searchEventsInputModel,
  searchEventsOutputModel,
  syncOutputModel,
  connectionStatusOutputModel,
} from "./model";

const TAGS = ["Calendar"];
const getPath = generatePath("Calendar");

export const calendarRouter = router({
  listEvents: TokenBasedProcedure.meta({
    openapi: { method: "GET", path: getPath("List"), tags: TAGS },
  })
    .input(listEventsInputModel)
    .output(listEventsOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        const { timeMin, timeMax, maxResults } = input;
        const events = await calendarService.listEvents(
          ctx.user.sub,
          timeMin,
          timeMax,
          maxResults,
        );
        return { events };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "list events route failed",
        });
      }
    }),

  getDashboardStats: TokenBasedProcedure.meta({
    openapi: { method: "GET", path: getPath("Stats"), tags: TAGS },
  })
    .input(z.void())
    .output(calendarStatsOutputModel)
    .query(async ({ ctx }) => {
      try {
        return await calendarService.getDashboardStats(ctx.user.sub);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "get calendar stats route failed",
        });
      }
    }),

  getEventById: TokenBasedProcedure.meta({
    openapi: { method: "GET", path: getPath("GetById"), tags: TAGS },
  })
    .input(getEventByIdInputModel)
    .output(getEventByIdOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        return await calendarService.getEventById(ctx.user.sub, input.eventId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "get event by id route failed",
        });
      }
    }),

  createEvent: TokenBasedProcedure.meta({
    openapi: { method: "POST", path: getPath("Create"), tags: TAGS },
  })
    .input(createEventInputModel)
    .output(createEventOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        return await calendarService.createEvent(ctx.user.sub, {
          summary: input.summary,
          description: input.description,
          location: input.location,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          isAllDay: input.isAllDay,
          attendees: input.attendees,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "create event route failed",
        });
      }
    }),

  updateEvent: TokenBasedProcedure.meta({
    openapi: { method: "PUT", path: getPath("Update"), tags: TAGS },
  })
    .input(updateEventInputModel)
    .output(updateEventOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        const { eventId, ...eventData } = input;
        return await calendarService.updateEvent(ctx.user.sub, eventId, eventData);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "update event route failed",
        });
      }
    }),

  deleteEvent: TokenBasedProcedure.meta({
    openapi: { method: "DELETE", path: getPath("Delete"), tags: TAGS },
  })
    .input(deleteEventInputModel)
    .output(deleteEventOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        return await calendarService.deleteEvent(ctx.user.sub, input.eventId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "delete event route failed",
        });
      }
    }),

  syncEvents: TokenBasedProcedure.meta({
    openapi: { method: "GET", path: getPath("Sync"), tags: TAGS },
  })
    .input(z.void())
    .output(syncOutputModel)
    .query(async ({ ctx }) => {
      try {
        return await calendarService.syncEvents(ctx.user.sub);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "sync events route failed",
        });
      }
    }),

  searchEvents: TokenBasedProcedure.meta({
    openapi: { method: "POST", path: getPath("Search"), tags: TAGS },
  })
    .input(searchEventsInputModel)
    .output(searchEventsOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        const events = await calendarService.searchEvents(
          ctx.user.sub,
          input.query,
          input.maxResults,
        );
        return { events };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "search events route failed",
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
        return await calendarService.getConnectionStatus(ctx.user.sub);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "get connection status route failed",
        });
      }
    }),
});
