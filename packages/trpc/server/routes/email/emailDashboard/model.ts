import z from "zod";

export const listEmailsInputModel = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const emailSummaryModel = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  date: z.string(),
  snippet: z.string(),
  isRead: z.boolean(),
  isSpam: z.boolean(),
});

export const listEmailsOutputModel = z.object({
  emails: z.array(emailSummaryModel),
});

export const dashboardStatsOutputModel = z.object({
  totalEmails: z.number(),
  unreadCount: z.number(),
  spamCount: z.number(),
  todayCount: z.number(),
});

export const syncOutputModel = z.object({
  success: z.boolean(),
});

export const connectionStatusOutputModel = z.object({
  connected: z.boolean(),
  signInUrl: z.string().optional(),
});

export const connectEmailInputModel = z.object({
  plugin: z.string().describe("The OAuth plugin to use (e.g., 'gmail')"),
});

export const connectEmailOutputModel = z.object({
  url: z.string().describe("OAuth authorization URL"),
  state: z.string().describe("State parameter for CSRF protection"),
});

export const callbackInputModel = z.object({
  code: z.string().describe("Authorization code from OAuth provider"),
  state: z.string().describe("State parameter for CSRF protection"),
  plugin: z.string().describe("The plugin that was used"),
  access_token: z.string(),
  refresh_token: z.string()
});

export const callbackOutputModel = z.object({
  success: z.boolean(),
  message: z.string(),
});
