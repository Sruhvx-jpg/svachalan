import z from "zod";

// ========================= Event Summary (list item) =========================

export const eventSummaryModel = z.object({
  id: z.string(),
  summary: z.string(),
  description: z.string(),
  location: z.string(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  isAllDay: z.boolean(),
  status: z.string(),
  organizer: z.string(),
  attendeeCount: z.number(),
  hangoutLink: z.string(),
});

// ========================= Event Detail (full view) ==========================

const attendeeModel = z.object({
  email: z.string(),
  displayName: z.string(),
  responseStatus: z.string(),
  self: z.boolean(),
});

export const eventDetailModel = z.object({
  id: z.string(),
  summary: z.string(),
  description: z.string(),
  location: z.string(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  isAllDay: z.boolean(),
  status: z.string(),
  organizer: z.string(),
  organizerEmail: z.string(),
  creator: z.string(),
  creatorEmail: z.string(),
  attendees: z.array(attendeeModel),
  hangoutLink: z.string(),
  htmlLink: z.string(),
  recurrence: z.array(z.string()),
  colorId: z.string(),
  visibility: z.string(),
  created: z.string(),
  updated: z.string(),
});

// ========================= List Events =======================================

export const listEventsInputModel = z.object({
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
  maxResults: z.number().min(1).max(250).default(50),
});

export const listEventsOutputModel = z.object({
  events: z.array(eventSummaryModel),
});

// ========================= Dashboard Stats ===================================

export const calendarStatsOutputModel = z.object({
  totalEvents: z.number(),
  todayCount: z.number(),
  thisWeekCount: z.number(),
  upcomingCount: z.number(),
});

// ========================= Get Event By ID ===================================

export const getEventByIdInputModel = z.object({
  eventId: z.string().min(1, "Event ID is required"),
});

export const getEventByIdOutputModel = eventDetailModel;

// ========================= Create Event ======================================

export const createEventInputModel = z.object({
  summary: z.string().min(1, "Event title is required"),
  description: z.string().optional().default(""),
  location: z.string().optional().default(""),
  startDateTime: z.string().min(1, "Start date/time is required"),
  endDateTime: z.string().min(1, "End date/time is required"),
  isAllDay: z.boolean().optional().default(false),
  attendees: z.array(z.string().email()).optional().default([]),
});

export const createEventOutputModel = eventSummaryModel;

// ========================= Update Event ======================================

export const updateEventInputModel = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startDateTime: z.string().optional(),
  endDateTime: z.string().optional(),
  isAllDay: z.boolean().optional(),
});

export const updateEventOutputModel = eventSummaryModel;

// ========================= Delete Event ======================================

export const deleteEventInputModel = z.object({
  eventId: z.string().min(1, "Event ID is required"),
});

export const deleteEventOutputModel = z.object({
  success: z.boolean(),
});

// ========================= Search Events =====================================

export const searchEventsInputModel = z.object({
  query: z.string().min(1, "Search query cannot be empty"),
  maxResults: z.number().min(1).max(100).default(20),
});

export const searchEventsOutputModel = z.object({
  events: z.array(eventSummaryModel),
});

// ========================= Sync & Connection =================================

export const syncOutputModel = z.object({
  success: z.boolean(),
});

export const connectionStatusOutputModel = z.object({
  connected: z.boolean(),
  signInUrl: z.string().optional(),
});
