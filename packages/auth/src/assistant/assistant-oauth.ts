import { getEnv } from "@okazi/config";
import { AppError, err, ok, type Result } from "@okazi/core";
import { AUTH_BASE_PATH } from "../urls";

/**
 * Redirect URI registered for the first-party client (`provision:oauth` default). The assistant
 * never follows it: the code is read from the authorize response server-side, so the web app does
 * not need a page at this path.
 */
export const ASSISTANT_OAUTH_CALLBACK_PATH = "/api/assistant/oauth/callback";

/** Minimal scope: no refresh token (`offline_access`); tokens are re-minted when they expire. */
export const ASSISTANT_OAUTH_SCOPE = "openid";

export function assistantRedirectUri(): string {
  return new URL(ASSISTANT_OAUTH_CALLBACK_PATH, getEnv().WEB_URL).toString();
}

export type AuthEndpointInput = { path: string };

/** Absolute Better Auth endpoint, e.g. `/oauth2/token` → `http://localhost:3000/api/auth/oauth2/token`. */
export function authEndpoint({ path }: AuthEndpointInput): string {
  return `${getEnv().BETTER_AUTH_URL}${AUTH_BASE_PATH}${path}`;
}

/** `WEB_OAUTH_CLIENT_ID`, the only client whose tokens may carry the AI actor. */
export function assistantClientId(): Result<string> {
  const clientId = getEnv().WEB_OAUTH_CLIENT_ID;
  if (clientId) return ok({ value: clientId });
  const message =
    "WEB_OAUTH_CLIENT_ID is not set: run `pnpm --filter @okazi/web provision:oauth` and add it to .env";
  return err({ error: new AppError({ code: "INTERNAL", message }) });
}
