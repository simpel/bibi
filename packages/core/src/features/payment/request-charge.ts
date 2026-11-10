import { getEnv } from "@bibi/config";
import type { Result } from "../../errors/result";
import type { AttemptRef, CollectPort, ProviderAuth } from "../../providers/types";
import type { ChargeTarget } from "./payment-preconditions";
import type { PaymentCreateMethod } from "./schema";

/** Days until an invoice is due when the customer has no own payment terms. */
export const DEFAULT_INVOICE_DAYS = 30;

export type ApplicationFeeInput = { amountMinor: number };

/** Bibi's cut from `STRIPE_APPLICATION_FEE_BPS`; undefined when no fee is configured. */
export function applicationFee({ amountMinor }: ApplicationFeeInput): number | undefined {
  const bps = getEnv().STRIPE_APPLICATION_FEE_BPS;
  if (!bps) return undefined;
  return Math.round((amountMinor * bps) / 10_000);
}

/** What is charged, as stored on the PENDING payment row. */
export type ChargeRequest = {
  method: PaymentCreateMethod;
  amountMinor: number;
  currency: string;
  description: string | undefined;
};

export type RequestChargeInput = {
  collect: CollectPort;
  auth: ProviderAuth;
  paymentId: string;
  publicToken: string;
  organizationId: string;
  /** Same key, same attempt at the provider. */
  idempotencyKey: string;
  input: ChargeRequest;
  target: Pick<ChargeTarget, "order" | "customer">;
  applicationFeeMinor: number | undefined;
};

/** Asks the provider for an attempt (a checkout, a Swish request). */
export function requestCharge({
  collect,
  auth,
  paymentId,
  publicToken,
  organizationId,
  idempotencyKey,
  input,
  target,
  applicationFeeMinor,
}: RequestChargeInput): Promise<Result<AttemptRef>> {
  // The public payment page (ADR 0028) lives at /pay/<publicToken>; the provider returns there.
  const pageUrl = `${getEnv().WEB_URL}/pay/${publicToken}`;
  const { name, email, paymentTermsDays } = target.customer;
  return collect.startAttempt({
    auth,
    method: input.method,
    amountMinor: input.amountMinor,
    currency: input.currency,
    applicationFeeMinor,
    description: input.description ?? `Order #${target.order.reference}`,
    idempotencyKey,
    metadata: { paymentId, orderId: target.order.id, organizationId },
    // `checkout=success` lets the page show "processing" until the webhook marks it paid.
    successUrl: `${pageUrl}?checkout=success`,
    cancelUrl: pageUrl,
    recipient: { name, email: email ?? "" },
    daysUntilDue: paymentTermsDays ?? DEFAULT_INVOICE_DAYS,
  });
}
