import { AppError } from "../errors/app-error";
import { err, ok, type Result } from "../errors/result";
import { SELF_FEATURE } from "../permissions/features";
import type { ExecuteContext } from "./context";
import { hasPermission, type Permission } from "./permission";

export type CheckPermissionInput = {
  context: Pick<ExecuteContext, "actor" | "permissions">;
  permission: Permission;
  /** What is being run, for the error message (an operation name); defaults to the permission. */
  subject?: string;
  /** `false` refuses the AI actor outright (the operation's `aiAllowed`). Defaults to true. */
  aiAllowed?: boolean;
};

/**
 * The one capability gate (ADR 0050), used by `authorize` and by adapters that read straight from
 * the database (graph edges). System actors are trusted; users, AI (acting for a user) and API
 * keys need the permission. An API key has no own space (`self:*`): it belongs to the
 * organization, not a user. A missing capability is FORBIDDEN, never VALIDATION.
 */
export function checkPermission({
  context,
  permission,
  subject = permission,
  aiAllowed = true,
}: CheckPermissionInput): Result<true> {
  const { actor, permissions } = context;
  if (actor.type === "system") return ok({ value: true });
  const signedIn = actor.type === "apiKey" ? Boolean(actor.apiKeyId) : Boolean(actor.userId);
  if (!signedIn) {
    return err({ error: new AppError({ code: "UNAUTHENTICATED", message: "Sign in required" }) });
  }
  if (actor.type === "apiKey" && permission.startsWith(`${SELF_FEATURE}:`)) {
    return forbidden({ message: `An API key cannot run ${subject}: it has no user` });
  }
  if (actor.type === "ai" && !aiAllowed) {
    return forbidden({ message: `The assistant cannot run ${subject}` });
  }
  if (!hasPermission({ permissions, permission })) {
    return forbidden({ message: `Missing permission ${permission}` });
  }
  return ok({ value: true });
}

function forbidden({ message }: { message: string }): Result<true> {
  return err({ error: new AppError({ code: "FORBIDDEN", message }) });
}
