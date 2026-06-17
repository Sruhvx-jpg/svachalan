// pnpm packages
import { z } from "zod";

// in house modules
import { marketplaceService } from "../../services";

// current working directory files
import { router, TokenBasedProcedure } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Marketplace"];
const getPath = generatePath("marketplace");

export const marketplaceRouter = router({
  list: TokenBasedProcedure.meta({
    openapi: { method: "GET", path: getPath("list"), tags: TAGS },
  })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.string(),
          toolKey: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          planType: z.enum(["free", "monthly", "yearly", "lifetime"]),
          priceInPaise: z.number(),
          isActive: z.boolean(),
          createdAt: z.date(),
          updatedAt: z.date(),
          purchased: z.boolean(),
          licenseKey: z.string().nullable(),
          licenseActive: z.boolean(),
        })
      )
    )
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.user.sub;
        return await marketplaceService.listMarketplaceProducts(userId);
      } catch (error) {
        throw new Error(
          `${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }),

  issue: TokenBasedProcedure.meta({
    openapi: { method: "POST", path: getPath("issue"), tags: TAGS },
  })
    .input(
      z.object({
        productId: z.string().uuid(),
      })
    )
    .output(
      z.object({
        userProductId: z.string(),
        licenseKey: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.sub;
        return await marketplaceService.issueLicense(userId, input.productId);
      } catch (error) {
        throw new Error(
          `${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }),

  myProducts: TokenBasedProcedure.meta({
    openapi: { method: "GET", path: getPath("my-products"), tags: TAGS },
  })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.string(),
          toolKey: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          planType: z.enum(["free", "monthly", "yearly", "lifetime"]),
          priceInPaise: z.number(),
        })
      )
    )
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.user.sub;
        return await marketplaceService.listUserProducts(userId);
      } catch (error) {
        throw new Error(
          `${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }),
});
