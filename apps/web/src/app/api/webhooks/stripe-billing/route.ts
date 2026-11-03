import { createBillingWebhookHandler } from "@bibi/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createBillingWebhookHandler();

/** Stripe's signed webhook for Bibi's own subscription (ADR 0095 §8), separate from Connect. */
export const POST = (request: Request) => handler(request);
