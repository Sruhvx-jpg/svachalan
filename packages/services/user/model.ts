import { z } from "zod";

export const getAuthenticationMethodOutputSchema = z.object({});
export type GetAuthenticationMethodOutputSchema = z.infer<
  typeof getAuthenticationMethodOutputSchema
>;
