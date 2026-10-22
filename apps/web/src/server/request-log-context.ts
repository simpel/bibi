import "server-only";
import { type LogContext, requestIdFrom } from "@bibi/logger";
import { headers } from "next/headers";
import { cache } from "react";

/**
 * Log context of the current web render or server action (ADR 0014). `cache` makes it one
 * request id per request, shared by every `runOperation` call in that request.
 */
export const webLogContext = cache(async (): Promise<LogContext> => {
  return { requestId: requestIdFrom({ headers: await headers() }), surface: "web" };
});
