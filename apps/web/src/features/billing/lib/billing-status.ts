/** Stripe statuses of a subscription that already exists: paying again would make a second one. */
const SUBSCRIBED = new Set(["active", "trialing", "past_due", "incomplete"]);

export type IsSubscribedInput = { subscriptionStatus: string | null };

/** Whether the organization has a live subscription (then the portal changes it, not Checkout). */
export function isSubscribed({ subscriptionStatus }: IsSubscribedInput): boolean {
  return subscriptionStatus !== null && SUBSCRIBED.has(subscriptionStatus);
}
