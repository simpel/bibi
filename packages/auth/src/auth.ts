import { getEnv } from "@bibi/config";
import type { Db } from "@bibi/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { authAfterHook, authLogger } from "./auth-logging";
import { defaultActiveOrganization } from "./default-active-organization";
import { adminPlugin, DISABLED_ADMIN_PATHS } from "./plugins/admin";
import { apiKeyPlugin, DISABLED_API_KEY_PATHS } from "./plugins/api-key";
import { devSwitchUserPlugin } from "./plugins/dev-switch-user";
import { emailLoginPlugins } from "./plugins/email-login";
import { mcpPlugins } from "./plugins/mcp";
import { organizationPlugin } from "./plugins/organization";
import { AUTH_BASE_PATH } from "./urls";

export type CreateAuthInput = {
  db: Db;
  /** CLI only: schema generation runs without a database adapter. */
  withoutDatabase?: boolean;
};

/**
 * System log wiring (ADR 0014) and the disabled admin-plugin (ADR 0015) and API key (ADR 0005)
 * endpoints.
 */
const HARDENING = {
  logger: authLogger,
  hooks: { after: authAfterHook },
  disabledPaths: [...DISABLED_ADMIN_PATHS, ...DISABLED_API_KEY_PATHS],
};

/** Better Auth instance for Bibi. Use `getAuth()`; call this directly only in tests/CLI. */
export function createAuth({ db, withoutDatabase = false }: CreateAuthInput) {
  const env = getEnv();
  return betterAuth({
    appName: "Bibi",
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: AUTH_BASE_PATH,
    trustedOrigins: [env.WEB_URL, env.MCP_URL],
    ...HARDENING,
    ...(withoutDatabase ? {} : { database: prismaAdapter(db, { provider: "postgresql" }) }),
    // Magic link only (ADR 0005, addendum 2026-11-06).
    emailAndPassword: { enabled: false },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => ({
            data: {
              ...session,
              activeOrganizationId: await defaultActiveOrganization({ db, userId: session.userId }),
            },
          }),
        },
      },
    },
    plugins: [
      adminPlugin(),
      organizationPlugin({ db }),
      apiKeyPlugin(),
      devSwitchUserPlugin(),
      ...emailLoginPlugins(),
      ...mcpPlugins({ db }),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
