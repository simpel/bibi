import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import { billingStripeRequest } from "../../features/billing/stripe-billing-request";
import { stripeBadResponse } from "../../providers/stripe/stripe-bad-response";

/** The events `billing.applySignal` acts on (ADR 0095 §8). */
export const BILLING_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.paid",
  "invoice.payment_failed",
];

const EndpointSchema = z.object({ id: z.string(), secret: z.string() });
const IdSchema = z.object({ id: z.string() });

type KeyInput = { secretKey: string };

/** Creates the webhook endpoint; Stripe shows its signing secret only in this response. */
export async function createWebhookEndpoint({
  secretKey,
  url,
}: KeyInput & { url: string }): Promise<Result<{ id: string; secret: string }>> {
  const created = await billingStripeRequest({
    ...{ secretKey, method: "POST", path: "/webhook_endpoints" },
    params: {
      url,
      enabled_events: BILLING_WEBHOOK_EVENTS,
      description: "Bibi subscriptions (ADR 0095)",
    },
  });
  if (!created.ok) return created;
  const parsed = EndpointSchema.safeParse(created.value);
  return parsed.success ? ok({ value: parsed.data }) : stripeBadResponse({ what: "webhook" });
}

/** Points the stored endpoint at `url` again; its signing secret stays the same. */
export async function updateWebhookEndpoint({
  secretKey,
  id,
  url,
}: KeyInput & { id: string; url: string }): Promise<Result<true>> {
  const updated = await billingStripeRequest({
    ...{ secretKey, method: "POST", path: `/webhook_endpoints/${encodeURIComponent(id)}` },
    params: { url, enabled_events: BILLING_WEBHOOK_EVENTS, disabled: false },
  });
  return updated.ok ? ok({ value: true }) : updated;
}

/** The Customer Portal: card, invoices, billing details and cancelling at the period end. */
export async function createPortalConfiguration({ secretKey }: KeyInput): Promise<Result<string>> {
  const created = await billingStripeRequest({
    ...{ secretKey, method: "POST", path: "/billing_portal/configurations" },
    params: {
      business_profile: { headline: "Bibi" },
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        customer_update: { enabled: true, allowed_updates: ["name", "email", "address", "tax_id"] },
        subscription_cancel: { enabled: true, mode: "at_period_end" },
      },
    },
  });
  if (!created.ok) return created;
  const parsed = IdSchema.safeParse(created.value);
  return parsed.success ? ok({ value: parsed.data.id }) : stripeBadResponse({ what: "portal" });
}
