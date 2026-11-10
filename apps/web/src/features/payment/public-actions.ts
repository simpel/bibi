"use server";

import type { PaymentAttemptDto } from "@bibi/core/schemas";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import { redirectTargetOf, startAttemptForToken } from "@/server/start-public-attempt";
import { toActionResult } from "@/server/to-action-result";

export type StartPaymentAttemptActionInput = { token: string; method: string };

/**
 * `/pay/<token>`: the customer chose a method (ADR 0100). A hosted checkout redirects there; a
 * Swish attempt comes back with its QR token and app link for the page to show.
 */
export async function startPaymentAttemptAction({
  token,
  method,
}: StartPaymentAttemptActionInput): Promise<ActionResult<PaymentAttemptDto>> {
  const result = await startAttemptForToken({ token, method });
  const target = result.ok ? redirectTargetOf({ attempt: result.value }) : null;
  if (target) redirect(target);
  return toActionResult({ result });
}
