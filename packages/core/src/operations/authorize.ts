import { AppError } from "../errors/app-error";
import { err, ok, type Result } from "../errors/result";
import type { ExecuteContext } from "./context";
import { hasPermission } from "./permission";
import type { AnyOperation } from "./types";

export type AuthorizeInput = { operation: AnyOperation; context: ExecuteContext };

/** System actors are trusted; users and AI (acting for a user) need a role granting access. */
export function authorize({ operation, context }: AuthorizeInput): Result<true> {
  const { actor, roles } = context;
  if (actor.type === "system") return ok({ value: true });
  if (!actor.userId) {
    return err({ error: new AppError({ code: "UNAUTHENTICATED", message: "Sign in required" }) });
  }
  if (!hasPermission({ roles, permission: operation.permission })) {
    const message = `Missing permission ${operation.permission}`;
    return err({ error: new AppError({ code: "FORBIDDEN", message }) });
  }
  return ok({ value: true });
}
