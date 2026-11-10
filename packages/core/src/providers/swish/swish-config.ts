import { getEnv } from "@bibi/config";
import { AppError } from "../../errors/app-error";
import { err } from "../../errors/result";

/** Where Swish posts payment request and refund callbacks (unsigned, ADR 0100). */
export const SWISH_CALLBACK_PATH = "/api/providers/swish/webhook";

/** A Swish payment request lives three minutes (m-commerce and QR). */
export const SWISH_REQUEST_TTL_MS = 3 * 60 * 1000;

/** Swish takes SEK only. */
export const SWISH_CURRENCY = "SEK";

/** The API root up to and including `/swish-cpcapi`, without a trailing slash. */
export const swishApiUrl = (): string => getEnv().SWISH_API_URL.replace(/\/+$/, "");

export const swishCallbackUrl = (): string =>
  new URL(SWISH_CALLBACK_PATH, getEnv().WEB_URL).toString();

/** Swish needs the API root and a sealing key for the per-venue certificate. */
export const swishConfigured = (): boolean =>
  Boolean(getEnv().SWISH_API_URL && getEnv().INTEGRATION_SECRET_KEY);

export const swishNotConnected = () =>
  err({
    error: new AppError({
      code: "CONFLICT",
      message: "Swish is not connected. An admin connects it in Settings → Integrations.",
    }),
  });
