import "server-only";
import { resolveExecuteContext } from "@bibi/auth";
import type { ExecuteContext, Result } from "@bibi/core";
import { headers } from "next/headers";
import { cache } from "react";
import { getRequestSession } from "./session";

/**
 * The authenticated execution context for the current request (ADR 0010).
 * Cached per request so that operations across server components reuse
 * the resolved session and membership instead of re-querying the database on every call.
 */
export const getRequestContext = cache(async (): Promise<Result<ExecuteContext>> => {
  // The session this request already looked up, so the cookie is resolved once (ADR 0097).
  const result = await getRequestSession();
  const session = result.ok ? result.value : undefined;
  return resolveExecuteContext({ headers: await headers(), session });
});
