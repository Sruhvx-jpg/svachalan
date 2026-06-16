// pnpm packages
import { z } from "zod";

// in house modules
import { gmailDotAiService } from "../../../services";

// current working directory files
import { router, TokenBasedProcedure } from "../../../trpc";
import { generatePath } from "../../../utils/path-generator";

const TAGS = ["Gmail AI"];
const getPath = generatePath("GmailDotAi");

export const GmailDotAiRouter = router({
    chat: TokenBasedProcedure.meta({
        openapi: { method: "POST", path: getPath("chat"), tags: TAGS },
    })
        .input(
            z.object({
                message: z.string().min(1, "Message cannot be empty"),
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
                const response = await gmailDotAiService.chatWithAi(
                    input.message,
                    userId,
                );
                return { response };
            } catch (error) {
                throw new Error(
                    `${error instanceof Error ? error.message : String(error)}`,
                );
            }
        }),
});