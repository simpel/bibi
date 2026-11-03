import type { BillingAccessState } from "./schema";

/** Stripe statuses that pay for the app; `past_due` keeps it open while Stripe retries. */
const PAID = new Set(["active", "trialing"]);

export type DeriveAccessInput = {
  exempt: boolean;
  subscriptionStatus: string | null;
  trialEndsAt: Date;
  configured: boolean;
  now: Date;
};

/** Whether the organization may use the app (ADR 0095 §5). Only `REQUIRED` closes it. */
export function deriveAccess({
  exempt,
  subscriptionStatus,
  trialEndsAt,
  configured,
  now,
}: DeriveAccessInput): BillingAccessState {
  if (exempt) return "EXEMPT";
  if (subscriptionStatus && PAID.has(subscriptionStatus)) return "ACTIVE";
  if (subscriptionStatus === "past_due") return "PAST_DUE";
  if (now < trialEndsAt) return "TRIAL";
  if (!configured) return "UNCONFIGURED";
  return "REQUIRED";
}
