import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { emailRouter } from "./routes/emailDashboard/route";
import { GmailDotAiRouter } from "./routes/GoogleDotAi/route";
import { CorsairGoogleIntegrateOAuth } from "./routes/ConnectionGoogleProducts/route";
import { calendarRouter } from "./routes/calendar/calendarDashboard/route";
import { marketplaceRouter } from "./routes/marketplace/route";

export const serverRouter = router({
  health: healthRouter,
  Email: emailRouter,
  Calendar: calendarRouter,
  GmailDotAi: GmailDotAiRouter, // google.ai marketPlace product
  marketplace: marketplaceRouter,
  auth: authRouter,
  CorsairGoogleIntegrateOAuth: CorsairGoogleIntegrateOAuth
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
