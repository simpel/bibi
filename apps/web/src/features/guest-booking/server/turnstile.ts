import "server-only";
import { getEnv } from "@bibi/config";
import { AppError, err, ok, type Result } from "@bibi/core";
import { getLogger } from "@bibi/logger";

const SCRIPT_PATH = "/turnstile/v0/api.js?render=explicit";
const VERIFY_PATH = "/turnstile/v0/siteverify";

/** What the booking form needs to show the widget; null when no captcha is configured. */
export type CaptchaConfig = { siteKey: string; scriptUrl: string } | null;

/** Turnstile's site key and script (ADR 0119); unset keys skip the captcha (dev, tests, e2e). */
export function captchaConfig(): CaptchaConfig {
  const { TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, TURNSTILE_ORIGIN } = getEnv();
  if (!TURNSTILE_SITE_KEY || !TURNSTILE_SECRET_KEY || !TURNSTILE_ORIGIN) return null;
  return { siteKey: TURNSTILE_SITE_KEY, scriptUrl: `${TURNSTILE_ORIGIN}${SCRIPT_PATH}` };
}

export type VerifyTurnstileInput = {
  token: string;
  secret: string;
  origin: string;
  ip: string | null;
  /** Injectable for tests. */
  fetcher?: typeof fetch;
};

/** Asks Turnstile whether the widget's token is valid; any failure counts as not passed. */
export async function verifyTurnstile({
  token,
  secret,
  origin,
  ip,
  fetcher = fetch,
}: VerifyTurnstileInput): Promise<boolean> {
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetcher(`${origin}${VERIFY_PATH}`, { method: "POST", body });
    if (!response.ok) return false;
    const answer = (await response.json()) as { success?: unknown };
    return answer.success === true;
  } catch (error) {
    getLogger().warn({ event: "guestBooking.captchaUnreachable", err: error });
    return false;
  }
}

const CAPTCHA_FAILED = "The security check failed";

export type CheckCaptchaInput = { token: string | undefined; ip: string | null };

/** The create step's gate: passes when no captcha is configured or Turnstile accepts the token. */
export async function checkCaptcha({ token, ip }: CheckCaptchaInput): Promise<Result<true>> {
  const { TURNSTILE_SECRET_KEY, TURNSTILE_ORIGIN } = getEnv();
  if (!TURNSTILE_SECRET_KEY || !TURNSTILE_ORIGIN) return ok({ value: true });
  const passed = await verifyTurnstile({
    ...{ token: token ?? "", secret: TURNSTILE_SECRET_KEY, origin: TURNSTILE_ORIGIN, ip },
  });
  if (passed) return ok({ value: true });
  const issues = [{ path: "captcha", message: CAPTCHA_FAILED }];
  return err({ error: new AppError({ code: "VALIDATION", message: CAPTCHA_FAILED, issues }) });
}
