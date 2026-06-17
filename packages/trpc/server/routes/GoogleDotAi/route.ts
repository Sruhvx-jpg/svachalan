// pnpm packages
import { z } from "zod";

// in house modules
import { gmailDotAiService } from "../../services";

// current working directory files
import { router, TokenBasedProcedure } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Gmail AI"];
const getPath = generatePath("GmailDotAi");

export const GmailDotAiRouter = router({
    chat: TokenBasedProcedure.meta({
        openapi: { method: "POST", path: getPath("chat"), tags: TAGS },
    })
        .input(
            z.object({
                message: z.string().min(1, "Message cannot be empty"),
                sessionId: z.string().optional(),
            }),
        )
        .output(
            z.object({
                response: z.string().optional(),
                needsConfirmation: z.boolean().optional(),
                isConfirmed: z.boolean().optional(),
                isDeclined: z.boolean().optional(),
                sessionId: z.string().optional(),
                confirmationDetails: z.object({
                    action: z.enum(["send", "draft"]),
                    to: z.string(),
                    subject: z.string(),
                    body: z.string(),
                    code: z.string(),
                }).optional(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            try {
                const userId = ctx.user.sub;
                const result = await gmailDotAiService.chatWithAi(
                    input.message,
                    userId,
                    input.sessionId,
                );
                return result;
            } catch (error) {
                throw new Error(
                    `${error instanceof Error ? error.message : String(error)}`,
                );
            }
        }),

    executeApprovedScript: TokenBasedProcedure.meta({
        openapi: { method: "POST", path: getPath("execute-approved-script"), tags: TAGS },
    })
        .input(
            z.object({
                code: z.string().optional(),
            }),
        )
        .output(
            z.object({
                response: z.string(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            try {
                const userId = ctx.user.sub;
                const response = await gmailDotAiService.executeApprovedScript(
                    input.code,
                    userId,
                );
                return { response };
            } catch (error) {
                throw new Error(
                    `${error instanceof Error ? error.message : String(error)}`,
                );
            }
        }),

    getPendingReview: TokenBasedProcedure.meta({
        openapi: { method: "GET", path: getPath("get-pending-review"), tags: TAGS },
    })
        .input(z.object({}))
        .output(
            z.object({
                action: z.enum(["send", "draft"]),
                to: z.string(),
                subject: z.string(),
                body: z.string(),
                code: z.string(),
            }).nullable(),
        )
        .query(async ({ ctx }) => {
            const userId = ctx.user.sub;
            return gmailDotAiService.getPendingReview(userId);
        }),

    updatePendingReview: TokenBasedProcedure.meta({
        openapi: { method: "POST", path: getPath("update-pending-review"), tags: TAGS },
    })
        .input(
            z.object({
                to: z.string().optional(),
                subject: z.string().optional(),
                body: z.string().optional(),
            }),
        )
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.user.sub;
            gmailDotAiService.updatePendingReview(userId, input);
            return { success: true };
        }),

    discardPendingReview: TokenBasedProcedure.meta({
        openapi: { method: "POST", path: getPath("discard-pending-review"), tags: TAGS },
    })
        .input(z.object({}))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx }) => {
            const userId = ctx.user.sub;
            gmailDotAiService.clearPendingReview(userId);
            return { success: true };
        }),

    getSessions: TokenBasedProcedure.meta({
        openapi: { method: "GET", path: getPath("get-sessions"), tags: TAGS },
    })
        .input(z.object({}))
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    userId: z.string(),
                    title: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                })
            )
        )
        .query(async ({ ctx }) => {
            const userId = ctx.user.sub;
            return await gmailDotAiService.getSessions(userId);
        }),

    getMessages: TokenBasedProcedure.meta({
        openapi: { method: "GET", path: getPath("get-messages"), tags: TAGS },
    })
        .input(
            z.object({
                sessionId: z.string(),
            })
        )
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    sessionId: z.string(),
                    role: z.string(),
                    content: z.string().nullable(),
                    needsConfirmation: z.boolean().nullable(),
                    confirmationDetails: z.any().nullable(),
                    isConfirmed: z.boolean().nullable(),
                    isDeclined: z.boolean().nullable(),
                    createdAt: z.date(),
                })
            )
        )
        .query(async ({ input }) => {
            return await gmailDotAiService.getMessages(input.sessionId);
        }),

    createSession: TokenBasedProcedure.meta({
        openapi: { method: "POST", path: getPath("create-session"), tags: TAGS },
    })
        .input(
            z.object({
                title: z.string(),
            })
        )
        .output(
            z.object({
                id: z.string(),
                userId: z.string(),
                title: z.string(),
                createdAt: z.date(),
                updatedAt: z.date(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.user.sub;
            return await gmailDotAiService.createSession(userId, input.title);
        }),

    deleteSession: TokenBasedProcedure.meta({
        openapi: { method: "POST", path: getPath("delete-session"), tags: TAGS },
    })
        .input(
            z.object({
                sessionId: z.string(),
            })
        )
        .output(
            z.object({
                success: z.boolean(),
            })
        )
        .mutation(async ({ input }) => {
            return await gmailDotAiService.deleteSession(input.sessionId);
        }),
});