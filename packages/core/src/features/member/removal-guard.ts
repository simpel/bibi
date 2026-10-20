import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { ADMIN_ROLE, type FixedRole } from "../../permissions/fixed-roles";
import { checkCanManageMember } from "./role-access";

export type CheckAdminKeptInput = {
  context: Pick<OperationContext, "db">;
  /** The member's role now, and what it becomes (`null` = removed). */
  from: FixedRole | null;
  to: FixedRole | null;
};

/** The organization always keeps an admin (ADR 0034), also for system actors. */
export async function checkAdminKept({ context, from, to }: CheckAdminKeptInput) {
  if (from !== ADMIN_ROLE || to === ADMIN_ROLE) return ok({ value: true as const });
  const admins = await context.db.member.count({ where: { role: ADMIN_ROLE } });
  if (admins > 1) return ok({ value: true as const });
  const message = "The organization's last admin cannot be removed or given another role";
  return err({ error: new AppError({ code: "CONFLICT", message }) });
}

export type CheckRemovableInput = {
  context: Pick<OperationContext, "db" | "actor" | "roles">;
  role: FixedRole | null;
};

/** Never the last admin, never someone above the caller. */
export async function checkRemovable({
  context,
  role,
}: CheckRemovableInput): Promise<Result<true>> {
  const kept = await checkAdminKept({ context, from: role, to: null });
  if (!kept.ok) return kept;
  return checkCanManageMember({ context, role });
}
