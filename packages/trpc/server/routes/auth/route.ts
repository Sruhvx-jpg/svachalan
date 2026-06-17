import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { userService } from "../../services";

import { setAuthToken, deleteAuthToken } from "../../utils/cookie";
import { generatePath } from "../../utils/path-generator";


import { publicProcedure, 
        router, 
        TokenBasedProcedure } from "../../trpc";
import { getMeOutputModel, loginUserInputModel,
   loginUserOutputModel,
    registerUserInputModel, 
    registerUserOutputModel } from "./model";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  //==================================================== register router =============================================
  registerUser: publicProcedure.meta({
    openapi: {
      method: "POST", path: getPath("Register"), tags: TAGS
    }
  }).input(registerUserInputModel).output(registerUserOutputModel).mutation(async ({ input, ctx }) => {
    try {
      const { fullName, email, accessToken} = await userService.RegisterUser(input)

      setAuthToken(ctx, accessToken)

      return {
        fullName,
        email,
        accessToken
      }
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "register user route failed"
      })
    }
  }),

  // ============================================== login router ===================================================
  loginUser: publicProcedure.meta({
    openapi: {
      method: "POST", tags: TAGS, path: getPath("/loginUser")
    }
  }).input(loginUserInputModel).output(loginUserOutputModel).mutation(async ({ input, ctx }) => {
    try {
      const { fullName, email, accessToken } = await userService.loginUser(input)

      setAuthToken(ctx, accessToken)

      return {
        fullName,
        email,
        accessToken
      }
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "login user route error"
      })
    }
  }),

  //========================================= getMe route ==========================================
  getMe: TokenBasedProcedure.meta({
    openapi: {
      method: "GET", tags: TAGS, path: getPath("getMe")
    }
  }).output(getMeOutputModel).query(async({ctx}) => {
    const userId = ctx.user.sub

    const data = await userService.getMe(userId)

    return data
  }),

  //========================================= logout route ==========================================
  logout: TokenBasedProcedure.meta({
    openapi: {
      method: "POST", tags: TAGS, path: getPath("logout")
    }
  })
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx }) => {
      deleteAuthToken(ctx);
      return { success: true };
    }),
  //end
})
