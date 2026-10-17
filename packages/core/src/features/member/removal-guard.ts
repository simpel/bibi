import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { FixedRole } from "../../permissions/fixed-roles";
import { OWNER_ROLE } from "../../permissions/resources";
import { checkCanManageMember } from "./role-access";

export type CheckOwnerKeptInput = {
  context: Pick<OperationContext, "db">;
  /** The member's role now, and what it becomes (`null` = removed). */
  from: FixedRole | null;
  to: FixedRole | null;
};

/** The organization always keeps an owner (ADR 0034), also for system actors. */
export async function checkOwnerKept({ context, from, to }: CheckOwnerKeptInput) {
  if (from !== OWNER_ROLE || to === OWNER_ROLE) return ok({ value: true as const });
  const owners = await context.db.member.count({ where: { role: OWNER_ROLE } });
  if (owners > 1) return ok({ value: true as const });
  const message = "The organization's last owner cannot be removed or given another role";
  return err({ error: new AppError({ code: "CONFLICT", message }) });
}

export type CheckRemovableInput = {
  context: Pick<OperationContext, "db" | "actor" | "roles">;
  role: FixedRole | null;
};

/** Never the last owner, only an owner removes an owner, never someone above the caller. */
export async function checkRemovable({
  context,
  role,
}: CheckRemovableInput): Promise<Result<true>> {
  const kept = await checkOwnerKept({ context, from: role, to: null });
  if (!kept.ok) return kept;
  return checkCanManageMember({ context, role });
}
