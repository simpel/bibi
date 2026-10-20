import { FIXED_ROLES, type FixedRole, roleRank } from "@okazi/core/schemas";

export type AssignableRolesInput = { caller: FixedRole | null };

/**
 * Roles the caller may give with `member.assignRole`, `member.invite` or on an API key: none above
 * their own (ADR 0034).
 */
export function assignableRoles({ caller }: AssignableRolesInput): FixedRole[] {
  return FIXED_ROLES.filter(
    (role) => caller !== null && roleRank({ role }) <= roleRank({ role: caller }),
  );
}

export type CanManageInput = { caller: FixedRole | null; member: FixedRole | null };

/** Whether the caller's role reaches the member's (core refuses changing someone above you). */
export function canManageMember({ caller, member }: CanManageInput): boolean {
  if (caller === null) return false;
  return member === null || roleRank({ role: member }) <= roleRank({ role: caller });
}
