import { AppError } from "../errors/app-error";
import { err, type Result } from "../errors/result";
import { checkPermission } from "./check-permission";
import type { ExecuteContext } from "./context";
import type { AnyOperation } from "./types";

export type AuthorizeInput = {
  operation: AnyOperation;
  context: Pick<ExecuteContext, "actor" | "permissions">;
};

/**
 * The operation gate: a `systemOnly` operation refuses every actor but the system; everything
 * else is `checkPermission` with the operation's permission and `aiAllowed`.
 */
export function authorize({ operation, context }: AuthorizeInput): Result<true> {
  if (operation.systemOnly && context.actor.type !== "system") {
    const message = `${operation.name} is run by the system only`;
    return err({ error: new AppError({ code: "FORBIDDEN", message }) });
  }
  return checkPermission({
    context,
    permission: operation.permission,
    subject: operation.name,
    aiAllowed: operation.aiAllowed,
  });
}
