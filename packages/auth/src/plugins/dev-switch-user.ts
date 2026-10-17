import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import { DEV_EMAIL_SUFFIX, isDevEnvironment } from "../dev/dev-users";

const BodySchema = z.object({ userId: z.string().min(1) });

/**
 * Development only: starts a session for a seeded demo user without mail or password. The endpoint
 * is `SERVER_ONLY` (not reachable over HTTP, only via `auth.api` from a server action), refuses
 * outside `NODE_ENV=development`, and only accepts seeded `*.okazi.test` users.
 */
export function devSwitchUserPlugin() {
  return {
    id: "dev-switch-user",
    endpoints: {
      devSwitchUser: createAuthEndpoint(
        "/dev/switch-user",
        { method: "POST", body: BodySchema, metadata: { SERVER_ONLY: true } },
        async (ctx) => {
          if (!isDevEnvironment()) throw new APIError("NOT_FOUND", { message: "Not found" });
          const user = await ctx.context.internalAdapter.findUserById(ctx.body.userId);
          if (!user?.email.endsWith(DEV_EMAIL_SUFFIX)) {
            throw new APIError("FORBIDDEN", { message: "Not a seeded dev user" });
          }
          const session = await ctx.context.internalAdapter.createSession(user.id);
          await setSessionCookie(ctx, { session, user });
          return ctx.json({ userId: user.id });
        },
      ),
    },
  } as const;
}
