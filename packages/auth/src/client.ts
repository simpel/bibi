import { apiKeyClient } from "@better-auth/api-key/client";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { emailOTPClient, magicLinkClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient as createBetterAuthClient } from "better-auth/react";

export type CreateAuthClientInput = {
  /** Origin of the web app; omit in the browser to use the current origin. */
  baseURL?: string;
};

/**
 * Typed Better Auth client for the web app (browser-safe: no server imports).
 * Usage: `export const authClient = createAuthClient({})`, then `authClient.useSession()`,
 * `authClient.organization.setActive(...)`, `authClient.signIn.magicLink(...)`.
 */
export function createAuthClient({ baseURL }: CreateAuthClientInput = {}) {
  return createBetterAuthClient({
    ...(baseURL ? { baseURL } : {}),
    basePath: "/api/auth",
    plugins: [
      organizationClient(),
      apiKeyClient(),
      magicLinkClient(),
      emailOTPClient(),
      oauthProviderClient(),
    ],
  });
}

export type AuthClient = ReturnType<typeof createAuthClient>;
