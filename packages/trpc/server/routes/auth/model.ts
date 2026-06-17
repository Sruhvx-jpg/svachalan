import z from "zod";

//================================ register user input output ====================================
export const registerUserInputModel = z.object({
    fullName: z.string().describe("user's fullname"),
    email: z.string().describe("user's email address"),
    password: z.string().describe("user's password")
})

export const registerUserOutputModel = z.object({
    fullName: z.string().describe("user's fullname"),
    email: z.string().describe("user's email address"),
    accessToken: z.string().describe("user's access token"),
})

//================================ login user input output ====================================
export const loginUserInputModel = z.object({
    email: z.string().describe("user's account email"),
    password: z.string().describe("user's svachalan account password"),
})

export const loginUserOutputModel = z.object({
    fullName: z.string().describe("user's fullname"),
    email: z.string().describe("user's email address"),
    accessToken: z.string().describe("user's access token"),
})
//============================== getMe output model ==============================================
export const getMeOutputModel = z.object({
  fullName: z.string().describe("user's account fullname"),
  email: z.string().describe("user's account fullname"),
});