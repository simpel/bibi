import {
  type FixedRole,
  grantAll,
  type PermissionSet,
  type Resource,
  unionPermissions,
} from "@okazi/core";

/** Operational data a `member` writes (ADR 0034); everything else is configuration. */
const OPERATIONAL: readonly Resource[] = [
  "customer",
  "contact",
  "option",
  "quote",
  "ticket",
  "programItem",
  "assignment",
  "occupancy",
  "requirement",
  "payment",
  "sheet",
];

/**
 * Everyone's own space: their conversations, personal skills and connected OAuth apps
 * (`oauthGrant.*`). Private to the user (`conversation:admin`/`skill:admin` for everyone's and
 * organization skills, and `integration:admin` for API keys, stay with admins).
 */
const PERSONAL: readonly Resource[] = ["conversation", "skill", "integration"];

const write = ({ resources }: { resources: readonly Resource[] }): PermissionSet =>
  Object.fromEntries(resources.map((resource) => [resource, ["read", "write"] as const]));

const viewer = unionPermissions({
  sets: [grantAll({ upTo: "read" }), write({ resources: PERSONAL })],
});

/**
 * The constant role → permission map (ADR 0034). `admin` and `owner` grant the same Okazi
 * permissions; what only an owner may do (other owners, the organization itself) is checked by
 * core `member.*` and Better Auth's owner statements.
 */
export const ROLE_PERMISSIONS: Readonly<Record<FixedRole, PermissionSet>> = {
  viewer,
  member: unionPermissions({ sets: [viewer, write({ resources: OPERATIONAL })] }),
  admin: grantAll({ upTo: "admin" }),
  owner: grantAll({ upTo: "admin" }),
};

export type RolePermissionsInput = { role: FixedRole | null };

/** What a fixed role grants; no fixed role grants nothing (fail closed). */
export function rolePermissions({ role }: RolePermissionsInput): PermissionSet {
  return role ? ROLE_PERMISSIONS[role] : {};
}
