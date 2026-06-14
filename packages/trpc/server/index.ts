import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { emailRouter } from "./routes/email/emailDashboard/route";
import { GmailDotAiRouter } from "./routes/email/emailDotAI/route";

export const serverRouter = router({
  health: healthRouter,
  Email: emailRouter,
  GmailDotAi: GmailDotAiRouter,
  auth: authRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
