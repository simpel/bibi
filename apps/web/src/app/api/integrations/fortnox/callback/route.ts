import { fortnoxCallbackResponse } from "@/server/integration-callback-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (request: Request) => fortnoxCallbackResponse(request);
