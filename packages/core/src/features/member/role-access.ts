import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { type FixedRole, highestRole, roleRank } from "../../permissions/fixed-roles";
import { OWNER_ROLE } from "../../permissions/resources";

type Context = Pick<OperationContext, "actor" | "roles">;

const forbidden = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "FORBIDDEN", message }) });

/** The caller's rank; system actors outrank every role. */
export function callerRank({ context }: { context: Context }): number {
  if (context.actor.type === "system") return Number.POSITIVE_INFINITY;
  const role = highestRole({ roles: context.roles });
  return role ? roleRank({ role }) : -1;
}

export type CheckCanGrantRoleInput = { context: Context; role: FixedRole };

/** Anti-escalation (ADR 0034): nobody gives a role above their own. */
export function checkCanGrantRole({ context, role }: CheckCanGrantRoleInput): Result<true> {
  if (roleRank({ role }) <= callerRank({ context })) return ok({ value: true });
  return forbidden({ message: `You cannot give the ${role} role: it is above your own` });
}

export type CheckCanManageMemberInput = { context: Context; role: FixedRole | null };

/**
 * Only an owner changes or removes an owner, and nobody changes or removes a member whose role
 * is above their own. A member without a fixed role ranks lowest.
 */
export function checkCanManageMember({ context, role }: CheckCanManageMemberInput): Result<true> {
  const rank = role ? roleRank({ role }) : -1;
  if (rank <= callerRank({ context })) return ok({ value: true });
  if (role === OWNER_ROLE) return forbidden({ message: "Only an owner can change an owner" });
  return forbidden({ message: "You cannot change a member who has more access than you" });
}
