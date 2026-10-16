import { createStripeWebhookHandler } from "@okazi/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createStripeWebhookHandler();

/** Stripe's signed webhook (ADR 0028): payment results and account updates, no session. */
export const POST = (request: Request) => handler(request);
