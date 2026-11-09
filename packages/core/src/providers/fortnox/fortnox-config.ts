import { getEnv } from "@bibi/config";
import { AppError } from "../../errors/app-error";
import { err } from "../../errors/result";

export const FORTNOX_AUTH_URL = "https://apps.fortnox.se/oauth-v1/auth";
export const FORTNOX_TOKEN_URL = "https://apps.fortnox.se/oauth-v1/token";
export const FORTNOX_REVOKE_URL = "https://apps.fortnox.se/oauth-v1/revoke";
export const FORTNOX_API_URL = "https://api.fortnox.se/3";

/** The company lookup and invoicing (ADR 0087, 0090); a scope change needs a reconnect. */
export const FORTNOX_SCOPE = "companyinformation invoice customer payment";

/** Fortnox refresh tokens live 45 days from issue and rotate on every refresh. */
export const FORTNOX_REFRESH_TTL_MS = 45 * 24 * 60 * 60 * 1000;

/** Where Fortnox sends the browser back; registered in the Fortnox Developer Portal. */
export const FORTNOX_CALLBACK_PATH = "/api/integrations/fortnox/callback";

export type FortnoxCredentials = { clientId: string; clientSecret: string };

/** The app credentials, or null unless Fortnox and the sealing key are all configured. */
export function fortnoxCredentials(): FortnoxCredentials | null {
  const { FORTNOX_CLIENT_ID, FORTNOX_CLIENT_SECRET, INTEGRATION_SECRET_KEY } = getEnv();
  if (!FORTNOX_CLIENT_ID || !FORTNOX_CLIENT_SECRET || !INTEGRATION_SECRET_KEY) return null;
  return { clientId: FORTNOX_CLIENT_ID, clientSecret: FORTNOX_CLIENT_SECRET };
}

export function fortnoxRedirectUri(): string {
  return new URL(FORTNOX_CALLBACK_PATH, getEnv().WEB_URL).toString();
}

export const fortnoxNotConfigured = () =>
  err({
    error: new AppError({
      code: "UNAVAILABLE",
      message:
        "Fortnox is not configured (FORTNOX_CLIENT_ID, FORTNOX_CLIENT_SECRET, INTEGRATION_SECRET_KEY).",
    }),
  });

export const fortnoxNotConnected = () =>
  err({
    error: new AppError({
      code: "CONFLICT",
      message: "Fortnox is not connected. An admin connects it in Settings → Integrations.",
    }),
  });
