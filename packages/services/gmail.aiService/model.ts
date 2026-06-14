import z from "zod";

export const chatInputModel = z.object({
    message: z.string().min(1).max(2000),
    history: z.array(
        z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
        })
    ).default([])
})
export type chatInputModel = z.infer<typeof chatInputModel>