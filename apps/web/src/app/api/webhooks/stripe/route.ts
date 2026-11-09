import { providerWebhookResponse } from "@/server/provider-webhook-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The URL registered in Stripe's dashboard (ADR 0028), kept as an alias of the generic
 * `/api/providers/stripe/webhook` (ADR 0100).
 */
export const POST = (request: Request) => providerWebhookResponse({ request, segment: "stripe" });
