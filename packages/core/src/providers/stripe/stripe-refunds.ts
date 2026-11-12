import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import type { ProviderAuth, RefundState, RefundStatusInput } from "../types";
import { stripeBadResponse } from "./stripe-bad-response";
import { stripeFetch } from "./stripe-request";

type RefInput = { auth: ProviderAuth; providerReference: string };

const accountHeader = ({ auth }: { auth: ProviderAuth }) => ({
  "Stripe-Account": auth.externalAccountId ?? "",
});

/** The payment intent behind a paid checkout or invoice. */
export async function paymentIntentOf({
  auth,
  providerReference,
}: RefInput): Promise<Result<string>> {
  const kind = providerReference.startsWith("in_") ? "invoices" : "checkout/sessions";
  const read = await stripeFetch({
    method: "GET",
    path: `/v1/${kind}/${encodeURIComponent(providerReference)}`,
    headers: accountHeader({ auth }),
  });
  if (!read.ok) return read;
  const intent = read.value.payment_intent;
  return typeof intent === "string" ? ok({ value: intent }) : stripeBadResponse({ what: "intent" });
}

const RefundSchema = z.object({
  id: z.string(),
  status: z.string().nullish(),
  created: z.number().nullish(),
  metadata: z.record(z.string(), z.string()).nullish(),
});
const RefundListSchema = z.object({ data: z.array(RefundSchema) });

type StripeRefund = z.infer<typeof RefundSchema>;

/** Stripe's refund status as Bibi's: `succeeded`, `failed` or `canceled` settle it. */
function toState({ refund }: { refund: StripeRefund }): RefundState {
  const occurredAt = refund.created ? new Date(refund.created * 1000) : new Date();
  if (refund.status === "succeeded") {
    return { status: "SUCCEEDED", providerReference: refund.id, occurredAt };
  }
  if (refund.status === "failed" || refund.status === "canceled") {
    return { status: "FAILED", providerReference: refund.id, occurredAt };
  }
  return { status: "PENDING", providerReference: refund.id };
}

/** Bibi's refund among the payment intent's refunds, by the `refundId` it was sent with. */
async function findByMetadata({
  auth,
  providerReference,
  metadata,
}: RefundStatusInput): Promise<Result<StripeRefund | null>> {
  const intent = await paymentIntentOf({ auth, providerReference });
  if (!intent.ok) return intent;
  const query = new URLSearchParams({ payment_intent: intent.value, limit: "100" });
  const listed = await stripeFetch({
    method: "GET",
    path: `/v1/refunds?${query}`,
    headers: accountHeader({ auth }),
  });
  if (!listed.ok) return listed;
  const parsed = RefundListSchema.safeParse(listed.value);
  if (!parsed.success) return stripeBadResponse({ what: "refund list" });
  const found = parsed.data.data.find((r) => r.metadata?.refundId === metadata.refundId);
  return ok({ value: found ?? null });
}

/**
 * Reads a refund again (the refund retry job, ADR 0100): by its id when Bibi stored it, else
 * among the payment's refunds by Bibi's refund id in the metadata. None = MISSING (never sent).
 */
export async function stripeRefundStatus({
  ...input
}: RefundStatusInput): Promise<Result<RefundState>> {
  if (input.refundReference) {
    const read = await stripeFetch({
      method: "GET",
      path: `/v1/refunds/${encodeURIComponent(input.refundReference)}`,
      headers: accountHeader({ auth: input.auth }),
    });
    if (!read.ok) return read;
    const parsed = RefundSchema.safeParse(read.value);
    return parsed.success
      ? ok({ value: toState({ refund: parsed.data }) })
      : stripeBadResponse({ what: "refund" });
  }
  const found = await findByMetadata(input);
  if (!found.ok) return found;
  return ok({ value: found.value ? toState({ refund: found.value }) : { status: "MISSING" } });
}
