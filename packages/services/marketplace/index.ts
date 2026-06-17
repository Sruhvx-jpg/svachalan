// ++++++++++++++++++++++++ CODE OF CONDUCT ++++++++++++++++++++++++++
//1. Use private function to wrap drizzle db select and insert
//2. use try catch block everywhere, in catch block throw a error mentioning which private function it originated
//3. imports should first start with pnpm package -> in house modules/packages -> current working directory files

import jwt from "jsonwebtoken";

// in house modules
import { db, eq, and, inArray } from "@repo/database";
import { marketplaceProductsTable, userProductsTable, productLicenses } from "@repo/database/schema";
import apiErr from "@repo/utils/src/apiErr";

class MarketplaceService {
  // ========================================== private methods ====================================================

  private async getProducts() {
    try {
      return await db
        .select()
        .from(marketplaceProductsTable)
        .where(eq(marketplaceProductsTable.isActive, true));
    } catch (error) {
      throw new Error(`getProducts failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getUserProductsByUserId(userId: string) {
    try {
      return await db
        .select()
        .from(userProductsTable)
        .where(eq(userProductsTable.userId, userId));
    } catch (error) {
      throw new Error(`getUserProductsByUserId failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getLicensesByUserProductIds(userProductIds: string[]) {
    try {
      if (userProductIds.length === 0) return [];
      return await db
        .select()
        .from(productLicenses)
        .where(inArray(productLicenses.userProductId, userProductIds));
    } catch (error) {
      throw new Error(`getLicensesByUserProductIds failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getProductById(productId: string) {
    try {
      const [product] = await db
        .select()
        .from(marketplaceProductsTable)
        .where(eq(marketplaceProductsTable.id, productId));
      return product;
    } catch (error) {
      throw new Error(`getProductById failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async checkExistingUserProduct(userId: string, productId: string) {
    try {
      const [userProduct] = await db
        .select()
        .from(userProductsTable)
        .where(
          and(
            eq(userProductsTable.userId, userId),
            eq(userProductsTable.productId, productId)
          )
        );
      return userProduct;
    } catch (error) {
      throw new Error(`checkExistingUserProduct failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getLicenseByUserProductId(userProductId: string) {
    try {
      const [license] = await db
        .select()
        .from(productLicenses)
        .where(eq(productLicenses.userProductId, userProductId));
      return license;
    } catch (error) {
      throw new Error(`getLicenseByUserProductId failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createUserProductRecord(userId: string, productId: string, startsAt: Date) {
    try {
      const [userProduct] = await db
        .insert(userProductsTable)
        .values({
          userId,
          productId,
          startsAt,
        })
        .returning();
      return userProduct;
    } catch (error) {
      throw new Error(`createUserProductRecord failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createLicenseRecord(userProductId: string, licenseKey: string) {
    try {
      const [license] = await db
        .insert(productLicenses)
        .values({
          userProductId,
          licenseKey,
          isActive: true,
        })
        .returning();
      return license;
    } catch (error) {
      throw new Error(`createLicenseRecord failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ========================================= public methods ======================================================

  public async listMarketplaceProducts(userId: string) {
    try {
      const products = await this.getProducts();
      const userProducts = await this.getUserProductsByUserId(userId);

      const userProductIds = userProducts.map((up) => up.id);
      const licenses = await this.getLicensesByUserProductIds(userProductIds);

      return products.map((product) => {
        const userProduct = userProducts.find((up) => up.productId === product.id);
        const license = userProduct ? licenses.find((l) => l.userProductId === userProduct.id) : null;

        return {
          id: product.id,
          toolKey: product.toolKey,
          name: product.name,
          description: product.description,
          planType: product.planType,
          priceInPaise: product.priceInPaise,
          isActive: product.isActive,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          purchased: !!userProduct,
          licenseKey: license?.licenseKey || null,
          licenseActive: license?.isActive || false,
        };
      });
    } catch (error) {
      throw new Error(`listMarketplaceProducts failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async issueLicense(userId: string, productId: string) {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw apiErr.dataNotFound("Marketplace product not found");
      }

      let userProduct = await this.checkExistingUserProduct(userId, productId);
      let license;

      if (userProduct) {
        license = await this.getLicenseByUserProductId(userProduct.id);
        if (license) {
          return {
            userProductId: userProduct.id,
            licenseKey: license.licenseKey,
            isActive: license.isActive,
          };
        }
      }

      const startsAt = new Date();
      if (!userProduct) {
        userProduct = await this.createUserProductRecord(userId, productId, startsAt);
      }

      // Payload to be encoded in the JWT license key
      const payload = {
        userProductId: userProduct.id,
        userId,
        productId,
        createdAt: startsAt.toISOString(),
      };
      
      // Sign using the marketplace product's ID as the secret key
      const licenseKey = jwt.sign(payload, productId);

      license = await this.createLicenseRecord(userProduct.id, licenseKey);

      return {
        userProductId: userProduct.id,
        licenseKey: license.licenseKey,
        isActive: license.isActive,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "ApiError") {
        throw error;
      }
      throw new Error(`issueLicense failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async listUserProducts(userId: string) {
    try {
      const userProducts = await this.getUserProductsByUserId(userId);
      if (userProducts.length === 0) return [];

      const products = await this.getProducts();

      return userProducts
        .map((up) => {
          const product = products.find((p) => p.id === up.productId);
          if (!product) return null;
          return {
            id: product.id,
            toolKey: product.toolKey,
            name: product.name,
            description: product.description,
            planType: product.planType,
            priceInPaise: product.priceInPaise,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
    } catch (error) {
      throw new Error(
        `listUserProducts failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

export default MarketplaceService;
