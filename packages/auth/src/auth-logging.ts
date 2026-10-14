import { getLogger } from "@okazi/logger";
import { createAuthMiddleware } from "better-auth/api";

const LEVELS = {
  debug: "debug",
  info: "info",
  success: "info",
  warn: "warn",
  error: "error",
} as const;

type BetterAuthLevel = keyof typeof LEVELS;

/** Better Auth's own diagnostics, routed into the system log as `auth.library`. */
export const authLogger = {
  level: "info" as const,
  log: (level: BetterAuthLevel, message: string, ...args: unknown[]) => {
    const err = args.find((arg) => arg instanceof Error);
    getLogger()[LEVELS[level] ?? "info"]({
      event: "auth.library",
      msg: message,
      ...(err ? { err } : {}),
    });
  },
};

/**
 * Semantic auth events (ADR 0014). Status codes and failures of every auth endpoint are already
 * on the `http.request` line; this adds who signed in, and how.
 */
export const authAfterHook = createAuthMiddleware(async (ctx) => {
  const created = ctx.context.newSession;
  if (!created) return;
  getLogger().info({
    event: "auth.sessionCreated",
    path: ctx.path,
    userId: created.user.id,
    sessionId: created.session.id,
  });
});
