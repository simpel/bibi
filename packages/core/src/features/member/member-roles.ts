import { type FixedRole, parseFixedRole } from "../../permissions/fixed-roles";

export type ParseMemberRoleInput = { role: string | null };

/**
 * Better Auth stores the member's role as a string. Okazi only writes one fixed role
 * (ADR 0034); anything else (a stale name, a comma-separated list) is `null` and grants nothing.
 */
export function parseMemberRole({ role }: ParseMemberRoleInput): FixedRole | null {
  return parseFixedRole({ role: (role ?? "").trim() });
}
