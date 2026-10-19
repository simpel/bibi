import { AppError } from "../errors/app-error";
import { err, ok, type Result } from "../errors/result";
import { SELF_FEATURE } from "../permissions/features";
import type { ExecuteContext } from "./context";
import { hasPermission } from "./permission";
import type { AnyOperation } from "./types";

export type AuthorizeInput = {
  operation: AnyOperation;
  context: Pick<ExecuteContext, "actor" | "permissions">;
};

/**
 * System actors are trusted; users, AI (acting for a user) and API keys need the operation's
 * permission. The AI actor is refused outright for operations marked `aiAllowed: false`. An API
 * key has no own space (`self:*`, ADR 0050): it belongs to the organization, not a user.
 */
export function authorize({ operation, context }: AuthorizeInput): Result<true> {
  const { actor, permissions } = context;
  if (actor.type === "system") return ok({ value: true });
  const signedIn = actor.type === "apiKey" ? Boolean(actor.apiKeyId) : Boolean(actor.userId);
  if (!signedIn) {
    return err({ error: new AppError({ code: "UNAUTHENTICATED", message: "Sign in required" }) });
  }
  if (actor.type === "apiKey" && operation.permission.startsWith(`${SELF_FEATURE}:`)) {
    const message = `An API key cannot run ${operation.name}: it has no user`;
    return err({ error: new AppError({ code: "FORBIDDEN", message }) });
  }
  if (actor.type === "ai" && !operation.aiAllowed) {
    const message = `The assistant cannot run ${operation.name}`;
    return err({ error: new AppError({ code: "FORBIDDEN", message }) });
  }
  if (!hasPermission({ permissions, permission: operation.permission })) {
    const message = `Missing permission ${operation.permission}`;
    return err({ error: new AppError({ code: "FORBIDDEN", message }) });
  }
  return ok({ value: true });
}
