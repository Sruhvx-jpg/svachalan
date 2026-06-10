import { z } from "zod";


//================================================ Vannila-RegisterUserInputModel ===========================================
export const vanillaRegisterUserInputModel =  z.object({
  fullName: z.string().describe("fullname of user"),
  email: z.string().describe("email of the user"),
  password: z.string().describe("password of the user's svachalan account")
})
export type vanillaRegisterUserInputModelType = z.infer<typeof vanillaRegisterUserInputModel>


//================================================ Vannila-loginUserInputModel =======================================
export const vanillaloginUserInputModel = z.object({
  email: z.string().describe("user's acount email"),
  password: z.string().describe("user's account password")
})
export type vanillaloginUserInputModelType = z.infer<typeof vanillaloginUserInputModel>