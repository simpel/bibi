import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { isPermissionSubset, type PermissionSet } from "../../permissions/permission-set";

export type CheckCanGrantInput = {
  context: Pick<OperationContext, "actor" | "permissions">;
  permissions: PermissionSet;
};

/**
 * Anti-escalation (ADR 0014): a user (or the AI acting for one) can only create, change or
 * assign roles that grant no more than they have themselves. System actors are trusted.
 */
export function checkCanGrant({ context, permissions }: CheckCanGrantInput): Result<true> {
  if (context.actor.type === "system") return ok({ value: true });
  if (isPermissionSubset({ subset: permissions, of: context.permissions })) {
    return ok({ value: true });
  }
  const message = "You cannot grant permissions you do not have yourself";
  return err({ error: new AppError({ code: "FORBIDDEN", message }) });
}

export const roleNotFound = () =>
  err({ error: new AppError({ code: "NOT_FOUND", message: "Role not found" }) });

export const ownerIsFixed = () =>
  err({
    error: new AppError({ code: "FORBIDDEN", message: "The owner role cannot be changed" }),
  });

export const roleNameTaken = ({ name }: { name: string }) =>
  err({ error: new AppError({ code: "CONFLICT", message: `A role named "${name}" exists` }) });
