import z from "zod";
import { router, TokenBasedProcedure } from "../../../trpc";
import { generatePath } from "../../../utils/path-generator";
import { gmailDotAiService } from "../../../services";


const TAGS = ["Gmail"];
const getPath = generatePath('GmailDotAi')

export const GmailDotAiRouter  = router({
    chat: TokenBasedProcedure.meta({
        openapi: {method: "POST", path: getPath('chat'), tags: TAGS}
    }).input(z.object({message: z.string()})).output(z.string()).mutation( async({input, ctx}) => {
        const {message} =  input
        const userId = ctx.user.sub

        const res = await gmailDotAiService.chatWithAi(message, userId)

        return res
    })
    
})