import { providerWebhookResponse } from "@/server/provider-webhook-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ provider: string }> };

/** A provider's signed webhook or callback (ADR 0100): payment, refund and invoice results. */
export async function POST(request: Request, { params }: RouteContext) {
  const { provider } = await params;
  return providerWebhookResponse({ request, segment: provider });
}
