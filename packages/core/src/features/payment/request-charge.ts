import { getEnv } from "@okazi/config";
import { err, ok, type Result } from "../../errors/result";
import type { ChargeTarget } from "./payment-preconditions";
import type { ChargeBase } from "./provider";
import { getPaymentProvider } from "./provider-registry";
import type { PaymentCreateInput } from "./schema";

/** Days until a Stripe invoice is due when the customer has no own payment terms. */
export const DEFAULT_INVOICE_DAYS = 30;

export type ApplicationFeeInput = { amountMinor: number };

/** Okazi's cut from `STRIPE_APPLICATION_FEE_BPS`; undefined when no fee is configured. */
export function applicationFee({ amountMinor }: ApplicationFeeInput): number | undefined {
  const bps = getEnv().STRIPE_APPLICATION_FEE_BPS;
  if (!bps) return undefined;
  return Math.round((amountMinor * bps) / 10_000);
}

export type ChargeOutcome = { providerReference: string; url: string; expiresAt: Date | null };

export type RequestChargeInput = {
  paymentId: string;
  publicToken: string;
  organizationId: string;
  input: PaymentCreateInput;
  target: ChargeTarget;
  applicationFeeMinor: number | undefined;
};

/** Asks the provider for a checkout or an invoice; the payment id is the idempotency key. */
export async function requestCharge({
  paymentId,
  publicToken,
  organizationId,
  input,
  target,
  applicationFeeMinor,
}: RequestChargeInput): Promise<Result<ChargeOutcome>> {
  const base: ChargeBase = {
    connectedAccountId: target.connectedAccountId,
    amountMinor: input.amountMinor,
    currency: input.currency,
    applicationFeeMinor,
    description: input.description ?? `Ticket #${target.ticket.reference}`,
    idempotencyKey: `okazi-payment-${paymentId}`,
    metadata: { paymentId, ticketId: target.ticket.id, organizationId },
  };
  const provider = getPaymentProvider();
  if (input.method === "CARD") {
    // The public payment page (ADR 0028) lives at /pay/<publicToken>; Stripe returns there.
    const pageUrl = `${getEnv().WEB_URL}/pay/${publicToken}`;
    // `checkout=success` lets the page show "processing" until the webhook marks it paid.
    const successUrl = `${pageUrl}?checkout=success`;
    return provider.createCheckout({ ...base, successUrl, cancelUrl: pageUrl });
  }
  const { name, email, paymentTermsDays } = target.customer;
  const invoice = await provider.createInvoice({
    ...base,
    recipient: { name, email: email ?? "" },
    daysUntilDue: paymentTermsDays ?? DEFAULT_INVOICE_DAYS,
  });
  if (!invoice.ok) return err({ error: invoice.error });
  return ok({ value: { ...invoice.value, expiresAt: null } });
}
