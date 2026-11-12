import { getEnv } from "@bibi/config";
import { AppError } from "../../errors/app-error";
import { err } from "../../errors/result";
import type { OauthClient } from "../oauth/token-client";

/** Read and write customers, articles and customer invoices, and a refresh token. */
export const VISMA_SCOPE = "ea:api ea:sales offline_access";

/**
 * How long Bibi treats a Visma refresh token as alive. Visma documents two years; kept short on
 * purpose, since refreshing early is harmless and trusting a dead token is not.
 */
export const VISMA_REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Refresh connections whose refresh token has less than this left. */
export const VISMA_REFRESH_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** Where Visma sends the browser back; registered with the Spiris Partner Programme. */
export const VISMA_CALLBACK_PATH = "/api/providers/visma/callback";

/** How often the worker reads payments on open Visma invoices (Visma has no push for them). */
export const VISMA_POLL_INTERVAL_MS = 15 * 60 * 1000;

const trim = ({ url }: { url: string }) => url.replace(/\/+$/, "");

/** Hosts from env only (`""` while Visma is not configured; every caller checks `vismaClient` first). */
export const vismaIdentityUrl = () => trim({ url: getEnv().VISMA_IDENTITY_BASE_URL ?? "" });
export const vismaApiUrl = () => `${trim({ url: getEnv().VISMA_API_BASE_URL ?? "" })}/v2`;

/** The app credentials, or null unless Visma's four settings and the sealing key are all set. */
export function vismaClient(): OauthClient | null {
  const env = getEnv();
  const { VISMA_CLIENT_ID, VISMA_CLIENT_SECRET, INTEGRATION_SECRET_KEY } = env;
  if (!VISMA_CLIENT_ID || !VISMA_CLIENT_SECRET || !INTEGRATION_SECRET_KEY) return null;
  if (!env.VISMA_IDENTITY_BASE_URL || !env.VISMA_API_BASE_URL) return null;
  return { clientId: VISMA_CLIENT_ID, clientSecret: VISMA_CLIENT_SECRET };
}

export const vismaRedirectUri = (): string =>
  new URL(VISMA_CALLBACK_PATH, getEnv().WEB_ORIGIN).toString();

export const vismaNotConfigured = () =>
  err({
    error: new AppError({
      code: "UNAVAILABLE",
      message:
        "Visma is not configured (VISMA_CLIENT_ID, VISMA_CLIENT_SECRET, VISMA_IDENTITY_BASE_URL, " +
        "VISMA_API_BASE_URL, INTEGRATION_SECRET_KEY).",
    }),
  });

export const vismaNotConnected = () =>
  err({
    error: new AppError({
      code: "CONFLICT",
      message: "Visma is not connected. An admin connects it in Settings → Integrations.",
    }),
  });
