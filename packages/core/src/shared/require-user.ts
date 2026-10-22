import { AppError } from "../errors/app-error";
import { err, ok, type Result } from "../errors/result";
import type { OperationContext } from "../operations/types";

export type RequireUserInput = { context: Pick<OperationContext, "actor"> };

/**
 * The acting user's id for the caller's own data (preferences, profile, files; ADR 0039, 0061).
 * The system actor and API keys have no user, so they get `FORBIDDEN`.
 */
export function requireUser({ context }: RequireUserInput): Result<string> {
  return context.actor.userId
    ? ok({ value: context.actor.userId })
    : err({ error: new AppError({ code: "FORBIDDEN", message: "This needs a signed-in user" }) });
}
