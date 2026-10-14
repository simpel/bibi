import { getEnv } from "@okazi/config";
import type { Db } from "@okazi/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { defaultActiveOrganization } from "./default-active-organization";
import { sendMail } from "./mail";
import { apiKeyPlugin } from "./plugins/api-key";
import { emailLoginPlugins } from "./plugins/email-login";
import { mcpPlugins } from "./plugins/mcp";
import { organizationPlugin } from "./plugins/organization";
import { AUTH_BASE_PATH } from "./urls";

export type CreateAuthInput = {
  db: Db;
  /** CLI only: schema generation runs without a database adapter. */
  withoutDatabase?: boolean;
};

/** Better Auth instance for Okazi. Use `getAuth()`; call this directly only in tests/CLI. */
export function createAuth({ db, withoutDatabase = false }: CreateAuthInput) {
  const env = getEnv();
  return betterAuth({
    appName: "Okazi",
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: AUTH_BASE_PATH,
    trustedOrigins: [env.WEB_URL, env.MCP_URL],
    ...(withoutDatabase ? {} : { database: prismaAdapter(db, { provider: "postgresql" }) }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      sendResetPassword: async ({ user, url }) => {
        await sendMail({ to: user.email, subject: "Återställ ditt lösenord", text: url });
      },
    },
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
      organizationPlugin(),
      apiKeyPlugin(),
      ...emailLoginPlugins(),
      ...mcpPlugins(),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
