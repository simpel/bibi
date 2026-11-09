import { getEnv } from "@bibi/config";
import { AppError } from "../../errors/app-error";
import { err } from "../../errors/result";
import type { OauthClient } from "../oauth/token-client";

/** Read and write customers, articles and customer invoices, and a refresh token. */
export const VISMA_SCOPE = "ea:api ea:sales offline_access";

/**
 * How long Bibi treats a Visma refresh token as alive. Kept short on purpose: refreshing early
 * is harmless, trusting a dead token is not. // Verify against Visma sandbox (real lifetime).
 */
export const VISMA_REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Refresh connections whose refresh token has less than this left. */
export const VISMA_REFRESH_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** Where Visma sends the browser back; registered in the Visma Developer Portal. */
export const VISMA_CALLBACK_PATH = "/api/providers/visma/callback";

/** How often the worker reads payments on open Visma invoices (Visma has no push for them). */
export const VISMA_POLL_INTERVAL_MS = 15 * 60 * 1000;

const trim = ({ url }: { url: string }) => url.replace(/\/+$/, "");

export const vismaIdentityUrl = () => trim({ url: getEnv().VISMA_IDENTITY_URL });
export const vismaApiUrl = () => `${trim({ url: getEnv().VISMA_API_URL })}/v2`;

/** The app credentials, or null unless Visma and the sealing key are all configured. */
export function vismaClient(): OauthClient | null {
  const { VISMA_CLIENT_ID, VISMA_CLIENT_SECRET, INTEGRATION_SECRET_KEY } = getEnv();
  if (!VISMA_CLIENT_ID || !VISMA_CLIENT_SECRET || !INTEGRATION_SECRET_KEY) return null;
  return { clientId: VISMA_CLIENT_ID, clientSecret: VISMA_CLIENT_SECRET };
}

export const vismaRedirectUri = (): string =>
  new URL(VISMA_CALLBACK_PATH, getEnv().WEB_URL).toString();

export const vismaNotConfigured = () =>
  err({
    error: new AppError({
      code: "UNAVAILABLE",
      message:
        "Visma is not configured (VISMA_CLIENT_ID, VISMA_CLIENT_SECRET, INTEGRATION_SECRET_KEY).",
    }),
  });

export const vismaNotConnected = () =>
  err({
    error: new AppError({
      code: "CONFLICT",
      message: "Visma is not connected. An admin connects it in Settings → Integrations.",
    }),
  });
