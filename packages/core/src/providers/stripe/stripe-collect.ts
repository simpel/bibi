import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { AttemptRef, CollectPort, ProviderAuth, StartAttemptInput } from "../types";
import type { ChargeBase } from "./charge-types";
import { stripeBadResponse } from "./stripe-bad-response";
import { stripeCharges } from "./stripe-charges";
import { stripeFormRequest } from "./stripe-form-request";
import { stripeFetch } from "./stripe-request";

const noAccount = () =>
  err({ error: new AppError({ code: "CONFLICT", message: "The Stripe account has no id yet" }) });

type AccountInput = { auth: ProviderAuth };

const accountOf = ({ auth }: AccountInput) => auth.externalAccountId;

/** A hosted card checkout; invoices go through the invoicing port (ADR 0100). */
async function startAttempt({
  auth,
  method,
  ...input
}: StartAttemptInput): Promise<Result<AttemptRef>> {
  const connectedAccountId = accountOf({ auth });
  if (!connectedAccountId) return noAccount();
  if (method !== "CARD") {
    return err({
      error: new AppError({ code: "CONFLICT", message: `Stripe does not take ${method}` }),
    });
  }
  const { successUrl, cancelUrl, recipient: _r, daysUntilDue: _d, ...rest } = input;
  const base: ChargeBase = { ...rest, connectedAccountId };
  const checkout = await stripeCharges.createCheckout({ ...base, successUrl, cancelUrl });
  if (!checkout.ok) return checkout;
  return ok({ value: { ...checkout.value, qrToken: null } });
}

type RefInput = AccountInput & { providerReference: string };

/** Expires an open checkout, or voids an open invoice. */
async function cancelAttempt({ auth, providerReference }: RefInput): Promise<Result<true>> {
  const connectedAccountId = accountOf({ auth });
  if (!connectedAccountId) return noAccount();
  const id = encodeURIComponent(providerReference);
  const path = providerReference.startsWith("in_")
    ? `/invoices/${id}/void`
    : `/checkout/sessions/${id}/expire`;
  const done = await stripeFormRequest({ path, params: {}, connectedAccountId });
  return done.ok ? ok({ value: true }) : done;
}

type RefundAttemptInput = RefInput & {
  amountMinor: number;
  idempotencyKey: string;
  metadata: Record<string, string>;
};

/** The payment intent behind a paid checkout or invoice. */
async function paymentIntentOf({ auth, providerReference }: RefInput): Promise<Result<string>> {
  const kind = providerReference.startsWith("in_") ? "invoices" : "checkout/sessions";
  const read = await stripeFetch({
    method: "GET",
    url: `https://api.stripe.com/v1/${kind}/${encodeURIComponent(providerReference)}`,
    headers: { "Stripe-Account": accountOf({ auth }) ?? "" },
  });
  if (!read.ok) return read;
  const intent = read.value.payment_intent;
  return typeof intent === "string" ? ok({ value: intent }) : stripeBadResponse({ what: "intent" });
}

/** A refund of a paid checkout or invoice (`payment.refund`); metadata finds it again. */
async function refund({ amountMinor, idempotencyKey, metadata, ...ref }: RefundAttemptInput) {
  const connectedAccountId = accountOf(ref);
  if (!connectedAccountId) return noAccount();
  const intent = await paymentIntentOf(ref);
  if (!intent.ok) return intent;
  const params = { payment_intent: intent.value, amount: amountMinor, metadata };
  const done = await stripeFormRequest({
    path: "/refunds",
    params,
    connectedAccountId,
    idempotencyKey,
  });
  if (!done.ok) return done;
  const id = done.value.id;
  return typeof id === "string"
    ? ok({ value: { providerReference: id } })
    : stripeBadResponse({ what: "refund" });
}

/** Card payments as direct charges on the venue's connected account (ADR 0028). */
export const stripeCollect: CollectPort = {
  methods: ["CARD"],
  onDemand: false,
  startAttempt,
  cancelAttempt,
  refund,
};
