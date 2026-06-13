import { Pool } from 'pg';
import { createCorsair, setupCorsair } from 'corsair';
import { gmail } from "@corsair-dev/gmail"


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// export const corsair = createCorsair({
//   plugins: [
//     gmail({
//       authType: "oauth_2",
//       credentials: {
//         clientId: process.env.GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       },
//     })
//   ],
//   database: pool,
//   kek: process.env.CORSAIR_KEK!,
//   multiTenancy: true,
// });

export const corsair = createCorsair({
    multiTenancy: true,
    plugins: [gmail({ authType: "oauth_2" })],
    kek: process.env.CORSAIR_KEK!,
    database: pool
});

let setupPromise: Promise<string> | null = null;

export function ensureCorsairSetup() {
  setupPromise ??= setupCorsair(corsair, {
    credentials: {
      gmail: {
        client_id: process.env.CLIENT_CLIENT_ID!,
        client_secret: process.env.CLIENT_CLIENT_SECRET!,
      },
    },
  });

  return setupPromise;
}

export function getTenant(userId: string) {
  return corsair.withTenant(userId);
}
