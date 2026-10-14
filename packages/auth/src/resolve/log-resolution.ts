import type { ExecuteContext, Result } from "@okazi/core";
import { addToLogContext, getLogger } from "@okazi/logger";
import type { Credential } from "./read-credential";

export type LogResolutionInput = {
  credential: Credential["kind"];
  resolved: Result<ExecuteContext>;
};

/**
 * Success: every later log line of the request carries the caller (ADR 0014).
 * Failure: one `auth.resolveFailed` line. A missing session is routine (info); a bad API key or
 * token, or a non-member, is worth a warning.
 */
export function logResolution({ credential, resolved }: LogResolutionInput): void {
  if (resolved.ok) {
    const { organizationId, actor } = resolved.value;
    addToLogContext({
      fields: {
        organizationId,
        userId: actor.userId,
        actorType: actor.type,
        ...(actor.conversationId ? { conversationId: actor.conversationId } : {}),
      },
    });
    return;
  }
  const { code } = resolved.error;
  const routine = credential === "session" && code === "UNAUTHENTICATED";
  getLogger()[routine ? "info" : "warn"]({
    event: "auth.resolveFailed",
    credential,
    errorCode: code,
    errorMessage: resolved.error.message,
  });
}
