import { CreateExpressContextOptions } from "@trpc/server/adapters/express"
import { createCookieFactory, deleteCookieFactory, getCookieFactory } from "./utils/cookie"

export interface TRPCContext {
    createCookie: ReturnType <typeof createCookieFactory>
    getCookie: ReturnType <typeof getCookieFactory>
    deleteCookie: ReturnType <typeof deleteCookieFactory>
    req: CreateExpressContextOptions["req"]
}

export async function createContext({req, res}: CreateExpressContextOptions): Promise<TRPCContext> {
    const ctx: TRPCContext = {
        createCookie: createCookieFactory(res),
        getCookie: getCookieFactory(req),
        deleteCookie: deleteCookieFactory(res),
        req,
    }

    return ctx
}

export type context = Awaited<ReturnType<typeof createContext>>