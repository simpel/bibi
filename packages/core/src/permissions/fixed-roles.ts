import { z } from "zod";

/**
 * The fixed organization roles, weakest first (ADR 0034). Not configurable. What each grants is
 * a constant in `packages/auth`; core only compares them (anti-escalation, the last admin).
 */
export const FIXED_ROLES = ["member", "manager", "admin"] as const;
export type FixedRole = (typeof FIXED_ROLES)[number];

/** The organization role with every permission. Every organization keeps at least one. */
export const ADMIN_ROLE = "admin" satisfies FixedRole;

/**
 * `user.role` of a superadmin (ADR 0015): runs the whole platform (`/admin`). A platform role,
 * not an organization role; it grants nothing inside an organization by itself.
 */
export const SUPERADMIN_ROLE = "superadmin";

export const FixedRoleSchema = z
  .enum(FIXED_ROLES)
  .describe(
    "member reads, manager also handles bookings and other operational data, admin everything",
  );

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

/** Position in `FIXED_ROLES`; -1 for anything else (an unknown name ranks below member). */
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
