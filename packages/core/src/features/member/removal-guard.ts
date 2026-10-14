import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { isPermissionSubset } from "../../permissions/permission-set";
import { OWNER_ROLE } from "../../permissions/resources";
import { grantedByRoles } from "./assigned-roles";
import { memberHasRoleWhere } from "./member-roles";

export type CheckRemovableInput = {
  context: Pick<OperationContext, "db" | "actor" | "roles" | "permissions">;
  roles: readonly string[];
};

const refuse = ({ code, message }: { code: "CONFLICT" | "FORBIDDEN"; message: string }) =>
  err({ error: new AppError({ code, message }) });

/**
 * The organization always keeps an owner, only an owner removes another owner, and nobody
 * removes a member who has more access than they have themselves (ADR 0020).
 */
export async function checkRemovable({
  context,
  roles,
}: CheckRemovableInput): Promise<Result<true>> {
  const trusted = context.actor.type === "system";
  if (roles.includes(OWNER_ROLE)) {
    const owners = await context.db.member.count({
      where: memberHasRoleWhere({ name: OWNER_ROLE }),
    });
    if (owners <= 1)
      return refuse({ code: "CONFLICT", message: "The last owner cannot be removed" });
    if (trusted || context.roles.includes(OWNER_ROLE)) return ok({ value: true });
    return refuse({ code: "FORBIDDEN", message: "Only an owner can remove an owner" });
  }
  const permissions = await grantedByRoles({ context, names: roles });
  if (trusted || isPermissionSubset({ subset: permissions, of: context.permissions })) {
    return ok({ value: true });
  }
  const message = "You cannot remove a member who has more access than you";
  return refuse({ code: "FORBIDDEN", message });
}
