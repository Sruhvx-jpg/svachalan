import { TRPCError } from "@trpc/server";
import { z, zodUndefinedModel } from "../../schema";
import { userService } from "../../services";
import { publicProcedure, router } from "../../trpc";
import { setAuthToken } from "../../utils/cookie";
import { generatePath } from "../../utils/path-generator";
import { loginUserInputModel, loginUserOutputModel, registerUserInputModel, registerUserOutputModel } from "./model";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  //==================================================== register router =============================================
  registerUser: publicProcedure.meta({
    openapi: {
      method: "POST", path: getPath("login"), tags: TAGS
    }
  }).input(registerUserInputModel).output(registerUserOutputModel).mutation(async ({ input, ctx }) => {
    try {
      const { fullName, email, accessToken} = await userService.RegisterUser(input)

      setAuthToken(ctx, accessToken)

      return {
        fullName,
        email
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
        email
      }
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "login user route error"
      })
    }
  })
  //end
})
