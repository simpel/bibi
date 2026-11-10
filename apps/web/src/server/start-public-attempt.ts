import "server-only";
import {
  AppError,
  err,
  type PaymentAttemptDto,
  PaymentStartAttemptInputSchema,
  type Result,
  startPublicAttempt,
} from "@bibi/core";
import { runWithLogContext } from "@bibi/logger";
import { webLogContext } from "./request-log-context";

export type StartPublicAttemptInput = { token: unknown; method: unknown };

/**
 * The public payment page's start (ADR 0100): no session, the token is the credential. Validates
 * the input, then core pins the organization by the token and starts (or reuses) an attempt with
 * the chosen method's routed provider. A bad or unknown token is NOT_FOUND.
 */
export async function startAttemptForToken({
  token,
  method,
}: StartPublicAttemptInput): Promise<Result<PaymentAttemptDto>> {
  const parsed = PaymentStartAttemptInputSchema.safeParse({ token, method });
  if (!parsed.success) {
    return err({ error: new AppError({ code: "VALIDATION", message: "Unknown payment method" }) });
  }
  return runWithLogContext({
    context: await webLogContext(),
    fn: () => startPublicAttempt(parsed.data),
  });
}

/** Where the browser goes at once: a hosted page (card checkout); a QR code (Swish) stays here. */
export function redirectTargetOf({ attempt }: { attempt: PaymentAttemptDto }): string | null {
  if (attempt.qrToken || !attempt.url) return null;
  return attempt.url.startsWith("https://") ? attempt.url : null;
}
