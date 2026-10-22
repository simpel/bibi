import "server-only";
import { getPublicPayment } from "@bibi/core";
import type { PublicPaymentDto } from "@bibi/core/schemas";
import { runWithLogContext } from "@bibi/logger";
import { webLogContext } from "./request-log-context";

export type LoadPublicPaymentInput = { token: string };

/**
 * Data access of the public payment page (ADR 0028): no session, the token is the credential.
 * A page is not a `Request` handler, so the request context is opened here (ADR 0014) instead of
 * `withRequestLogging`. Returns `null` for an unknown token.
 */
export async function loadPublicPayment({
  token,
}: LoadPublicPaymentInput): Promise<PublicPaymentDto | null> {
  return runWithLogContext({
    context: await webLogContext(),
    fn: async () => {
      const result = await getPublicPayment({ token });
      if (result.ok) return result.value;
      if (result.error.code === "NOT_FOUND") return null;
      throw result.error;
    },
  });
}
