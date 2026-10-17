import { FIXED_ROLES, type FixedRole, GRANTABLE_ROLES, roleRank } from "@okazi/core/schemas";

export type AssignableRolesInput = { caller: FixedRole | null };

const upTo = <T extends FixedRole>({
  roles,
  caller,
}: {
  roles: readonly T[];
  caller: FixedRole | null;
}) => roles.filter((role) => caller !== null && roleRank({ role }) <= roleRank({ role: caller }));

/** Roles the caller may give with `member.assignRole`: none above their own (ADR 0034). */
export function assignableRoles({ caller }: AssignableRolesInput): FixedRole[] {
  return upTo({ roles: FIXED_ROLES, caller });
}

/** Roles the caller may invite with: never `owner`, none above their own. */
export function invitableRoles({ caller }: AssignableRolesInput): FixedRole[] {
  return upTo({ roles: GRANTABLE_ROLES, caller });
}

export type CanManageInput = { caller: FixedRole | null; member: FixedRole | null };

/** Whether the caller's role reaches the member's (core refuses changing someone above you). */
export function canManageMember({ caller, member }: CanManageInput): boolean {
  if (caller === null) return false;
  return member === null || roleRank({ role: member }) <= roleRank({ role: caller });
}
