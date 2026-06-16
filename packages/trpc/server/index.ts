import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { emailRouter } from "./routes/email/emailDashboard/route";
import { GmailDotAiRouter } from "./routes/email/emailDotAI/route";
import { CorsairGoogleIntegrateOAuth } from "./routes/ConnectionGoogleProducts/route";
import { calendarRouter } from "./routes/calendar/calendarDashboard/route";

export const serverRouter = router({
  health: healthRouter,
  Email: emailRouter,
  Calendar: calendarRouter,
  GmailDotAi: GmailDotAiRouter,
  auth: authRouter,
  CorsairGoogleIntegrateOAuth: CorsairGoogleIntegrateOAuth
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
