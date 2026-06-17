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
  monthlyStats: z.array(
    z.object({
      label: z.string(),
      count: z.number(),
    })
  ),
});

export const syncOutputModel = z.object({
  success: z.boolean(),
});

export const connectionStatusOutputModel = z.object({
  connected: z.boolean(),
  signInUrl: z.string().optional(),
});

export const searchEmailsInputModel = z.object({
  query: z.string().min(1, "Search query cannot be empty"),
  maxResults: z.number().min(1).max(100).default(20),
});

export const searchEmailsOutputModel = z.object({
  emails: z.array(emailSummaryModel),
});

export const getEmailByIdInputModel = z.object({
  emailId: z.string().min(1, "Email ID is required"),
});

export const getEmailByIdOutputModel = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  to: z.string(),
  date: z.string(),
  snippet: z.string(),
  body: z.string(),
  isRead: z.boolean(),
  isSpam: z.boolean(),
});
