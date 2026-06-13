import z from "zod";

//=========================== list emails input and type ======================
export const listEmailsInputModel = z.object({
    userId: z.string().describe("user's id"),
    limit: z.number().describe("limit of emails"),
    offset: z.number().describe("offset for pagination")
})

export type listEmailsInputModelType = z.infer<typeof listEmailsInputModel>