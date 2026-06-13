import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { emailRouter } from "./routes/email/emailDashboard/route";

export const serverRouter = router({
  health: healthRouter,
  Email: emailRouter,
  auth: authRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
