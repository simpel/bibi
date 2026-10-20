import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";

export type CheckKeyCallerInput = { context: Pick<OperationContext, "actor" | "credential"> };

const forbidden = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "FORBIDDEN", message }) });

/**
 * Only a member signed in to the web app (a session) may mint a key (ADR 0005): an OAuth client
 * (e.g. a third-party MCP chat) or another key must not receive a secret that outlives it. The
 * AI actor is refused by `aiAllowed: false` before the handler runs.
 */
export function checkKeyCaller({ context }: CheckKeyCallerInput): Result<string> {
  const { actor, credential } = context;
  if (credential !== "session") return forbidden({ message: "Create API keys in the web app" });
  if (actor.type !== "user" || !actor.userId) {
    return forbidden({ message: "An API key needs a signed-in admin" });
  }
  return ok({ value: actor.userId });
}
