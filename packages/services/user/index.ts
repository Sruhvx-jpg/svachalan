// ++++++++++++++++++++++++ CODE OF CONDUCT ++++++++++++++++++++++++++
//1. Use private function to wrap drizzle db select and insert
//2. use try catch block everywhere, in catch block throw a error mentioning which private function it originated
//3. imports should first start with pnpm package -> in house modules/packages -> current working directory files

// in house modules
import { db, eq } from "@repo/database";
import { refreshTokensTable, usersTable } from "@repo/database/schema";
import {
  generateAccTok,
  generateRefTok,
  hashIT,
  comparePass
} from "@repo/utils";
import apiErr from "@repo/utils/src/apiErr";

// current working directory files
import {
  vanillaRegisterUserInputModel,
  vanillaRegisterUserInputModelType,
  vanillaloginUserInputModel,
  vanillaloginUserInputModelType
} from "./model";

class UserService {
  // ========================================== private methods ====================================================

  private async getUserByEmail(email: string) {
    try {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

      return user;
    } catch (error) {
      throw new Error(
        `getUserByEmail failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createUser(fullName: string, email: string, password: string,) {
    try {
      const [user] = await db.insert(usersTable).values({ fullName, email, password, })
        .returning({
          id: usersTable.id,
          fullName: usersTable.fullName,
          email: usersTable.email,
        });

      return user;
    } catch (error) {
      throw new Error(
        `createUser failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async saveRefreshToken(userId: string,refreshToken: string) {
    try {

      const hashedRefTok = await hashIT(refreshToken)
      const expiresAt = new Date(Date.now() + + 60 * 24 * 60 * 60 * 1000)
      await db.insert(refreshTokensTable).values({userId, tokenHash: hashedRefTok,expiresAt});
    } catch (error) {
      throw new Error(`saveRefreshToken failed: ${error instanceof Error ? error.message : String(error)}`,);
    }
  }

  // ========================================= public methods ======================================================

  public async RegisterUser(payload: vanillaRegisterUserInputModelType ) {
    try {
      const { fullName, email, password } =  await vanillaRegisterUserInputModel.parseAsync(payload);

      const existingUser = await this.getUserByEmail(email);

      if (existingUser) {
        throw apiErr.dataAlreadyExist("user with email already registered",);
      }

      const hashedPassword = await hashIT(password);

      const user = await this.createUser( fullName, email, hashedPassword, );
      if(!user) throw apiErr.unknownErr("user not returned")

      const tokenPayload = {sub: user.id}
      const accessToken = generateAccTok(tokenPayload);
      const refreshToken = generateRefTok(tokenPayload);

      await this.saveRefreshToken(user.id,refreshToken,);

      return { fullName: user.fullName, email: user.email,accessToken};
    } catch (error) {
      throw new Error(
        `RegisterUser failed: ${error instanceof Error ? error.message : String(error)}`, );
    }
  }

  public async loginUser(
  payload: vanillaloginUserInputModelType,
) {
  try {
    const { email, password } = await vanillaloginUserInputModel.parseAsync(payload,);

    const user = await this.getUserByEmail(email);

    if (!user) {
      throw apiErr.dataNotFound("invalid email or password");
    }

    const isPasswordValid = await comparePass(password,user.password,);

    if (!isPasswordValid) {
      throw apiErr.dataNotFound("invalid email or password",);
    }

    const tokenPayload = {sub: user.id};

    const accessToken = generateAccTok(tokenPayload)

    const refreshToken = generateRefTok(tokenPayload)

    await this.saveRefreshToken(user.id,refreshToken,)

    return {fullName: user.fullName,email: user.email,accessToken,}
  } catch (error) {
    if (error instanceof Error) {throw error;}

    throw new Error(`loginUser failed: ${String(error)}`,)
  }
}
  // end
}

export default UserService;