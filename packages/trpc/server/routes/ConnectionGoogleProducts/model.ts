import z from "zod"

export const connectEmailInputModel = z.object({
  plugin: z.string().describe("The OAuth plugin for user to give consent for access to"),
});

export const connectEmailOutputModel = z.object({
  url: z.string().describe("OAuth authorization URL"),
  state: z.string().describe("State parameter for CSRF protection"),
});

export const callbackInputModel = z.object({
  code: z.string().describe("Authorization code from OAuth provider"),
  state: z.string().describe("State parameter for CSRF protection"),
  plugin: z.string().describe("The plugin that was used"),
});

export const callbackOutputModel = z.object({
  success: z.boolean(),
  message: z.string(),
});