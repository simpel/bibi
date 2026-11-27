import "server-only";
import { getEnv } from "@bibi/config";
import { AppError, err, ok, type Result } from "@bibi/core";
import { getLogger } from "@bibi/logger";

const SCRIPT_PATH = "/turnstile/v0/api.js?render=explicit";
const VERIFY_PATH = "/turnstile/v0/siteverify";
/** The booking form's Turnstile action: the widget sends it, siteverify must return it. */
export const BOOKING_CAPTCHA_ACTION = "table_booking";
const MAX_TOKEN_LENGTH = 2048;
const VERIFY_TIMEOUT_MS = 10_000;

/** What the booking form needs to show the widget; null when no captcha is configured. */
export type CaptchaConfig = { siteKey: string; scriptUrl: string; action: string } | null;

/** Turnstile's site key and script (ADR 0119); unset keys skip the captcha (dev, tests, e2e). */
export function captchaConfig(): CaptchaConfig {
  const { TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, TURNSTILE_ORIGIN } = getEnv();
  if (!TURNSTILE_SITE_KEY || !TURNSTILE_SECRET_KEY || !TURNSTILE_ORIGIN) return null;
  return {
    siteKey: TURNSTILE_SITE_KEY,
    scriptUrl: `${TURNSTILE_ORIGIN}${SCRIPT_PATH}`,
    action: BOOKING_CAPTCHA_ACTION,
  };
}

export type VerifyTurnstileInput = {
  token: string;
  secret: string;
  origin: string;
  ip: string | null;
  /** The action the widget was rendered with; siteverify must answer with it. */
  action: string;
  /** Hostnames the widget may run on (the app's own host); never empty. */
  hostnames: readonly string[];
  /** Injectable for tests. */
  fetcher?: typeof fetch;
};

type SiteverifyAnswer = { success?: unknown; action?: unknown; hostname?: unknown };

/**
 * Asks Turnstile whether the widget's token is valid (single use, so a replay fails). Passes only
 * when siteverify says success for this form's action on one of our hostnames; any other answer,
 * a timeout (10 s) or an error counts as not passed.
 */
export async function verifyTurnstile({
  token,
  secret,
  origin,
  ip,
  action,
  hostnames,
  fetcher = fetch,
}: VerifyTurnstileInput): Promise<boolean> {
  if (!token || token.length > MAX_TOKEN_LENGTH || hostnames.length === 0) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetcher(`${origin}${VERIFY_PATH}`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    if (!response.ok) return false;
    const answer = (await response.json()) as SiteverifyAnswer;
    return (
      answer.success === true &&
      answer.action === action &&
      typeof answer.hostname === "string" &&
      hostnames.includes(answer.hostname)
    );
  } catch (error) {
    getLogger().warn({ event: "guestBooking.captchaUnreachable", err: error });
    return false;
  }
}

const CAPTCHA_FAILED = "The security check failed";

export type CheckCaptchaInput = { token: string | undefined; ip: string | null };

/** The create step's gate: passes when no captcha is configured or Turnstile accepts the token. */
export async function checkCaptcha({ token, ip }: CheckCaptchaInput): Promise<Result<true>> {
  const { TURNSTILE_SECRET_KEY, TURNSTILE_ORIGIN, WEB_ORIGIN } = getEnv();
  if (!TURNSTILE_SECRET_KEY || !TURNSTILE_ORIGIN) return ok({ value: true });
  const passed = await verifyTurnstile({
    ...{ token: token ?? "", secret: TURNSTILE_SECRET_KEY, origin: TURNSTILE_ORIGIN, ip },
    action: BOOKING_CAPTCHA_ACTION,
    // The booking pages are served from the app host, also when embedded in an iframe.
    hostnames: [new URL(WEB_ORIGIN).hostname],
  });
  if (passed) return ok({ value: true });
  const issues = [{ path: "captcha", message: CAPTCHA_FAILED }];
  return err({ error: new AppError({ code: "VALIDATION", message: CAPTCHA_FAILED, issues }) });
}
