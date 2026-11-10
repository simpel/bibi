import { providerCallbackResponse } from "@/server/integration-callback-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ provider: string }> };

/** Where an OAuth provider sends the admin back after consent (ADR 0087, 0100). */
export async function GET(request: Request, { params }: RouteContext) {
  const { provider } = await params;
  return providerCallbackResponse({ request, segment: provider });
}
