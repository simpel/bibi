import { z } from "zod";

/**
 * The fixed access roles, weakest first (ADR 0034). What each grants is a constant in
 * `packages/auth`; core only compares them (anti-escalation, owner rules).
 */
export const FIXED_ROLES = ["viewer", "member", "admin", "owner"] as const;
export type FixedRole = (typeof FIXED_ROLES)[number];

/** Roles that invitations and API keys may carry: never `owner`. */
export const GRANTABLE_ROLES = ["viewer", "member", "admin"] as const;
export type GrantableRole = (typeof GRANTABLE_ROLES)[number];

export const FixedRoleSchema = z
  .enum(FIXED_ROLES)
  .describe("viewer reads, member also writes operational data, admin also configures, owner all");

export const GrantableRoleSchema = z
  .enum(GRANTABLE_ROLES)
  .describe("viewer reads, member also writes operational data, admin also configures");

export type ParseFixedRoleInput = { role: string | null | undefined };

/** The fixed role named exactly `role`, or `null` for anything else. */
export function parseFixedRole({ role }: ParseFixedRoleInput): FixedRole | null {
  return FIXED_ROLES.find((fixed) => fixed === role) ?? null;
}

export type IsFixedRoleInput = { role: string };

export function isFixedRole({ role }: IsFixedRoleInput): boolean {
  return parseFixedRole({ role }) !== null;
}

export type RoleRankInput = { role: string };

/** Position in `FIXED_ROLES`; -1 for anything else (an unknown name ranks below viewer). */
export function roleRank({ role }: RoleRankInput): number {
  return (FIXED_ROLES as readonly string[]).indexOf(role);
}

export type HighestRoleInput = { roles: readonly string[] };

/** The strongest fixed role among `roles`, or `null` when none is a fixed role. */
export function highestRole({ roles }: HighestRoleInput): FixedRole | null {
  const ranked = roles.flatMap((role) => parseFixedRole({ role }) ?? []);
  if (ranked.length === 0) return null;
  return ranked.reduce((a, b) => (roleRank({ role: b }) > roleRank({ role: a }) ? b : a));
}

export type WeakerRoleInput = { a: FixedRole; b: FixedRole };

/** The weaker of two roles (an API key never outranks its member, nor the member the key). */
export function weakerRole({ a, b }: WeakerRoleInput): FixedRole {
  return roleRank({ role: a }) <= roleRank({ role: b }) ? a : b;
}
