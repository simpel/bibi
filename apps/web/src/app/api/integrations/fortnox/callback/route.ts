import { providerCallbackResponse } from "@/server/integration-callback-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The redirect URI registered in Fortnox's developer portal (ADR 0087), kept as an alias of the
 * generic `/api/providers/fortnox/callback` (ADR 0100).
 */
export const GET = (request: Request) => providerCallbackResponse({ request, segment: "fortnox" });
