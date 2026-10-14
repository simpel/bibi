import {
  OWNER_ROLE,
  type PermissionSet,
  parseRolePermissions,
  unionPermissions,
} from "@okazi/core";
import { getDb } from "@okazi/db";
import { ownerPermissions } from "../permissions";

export type ResolveRolePermissionsInput = { organizationId: string; roles: readonly string[] };

/**
 * Union of what `roles` grant in `organizationId`. `owner` is fixed (everything); other names
 * are looked up among the organization's ACTIVE roles. Unknown, archived or malformed roles
 * grant nothing (fail closed).
 */
export async function resolveRolePermissions({
  organizationId,
  roles,
}: ResolveRolePermissionsInput): Promise<PermissionSet> {
  if (roles.includes(OWNER_ROLE)) return ownerPermissions();
  if (roles.length === 0) return {};
  const rows = await getDb().organizationRole.findMany({
    where: { organizationId, role: { in: [...roles] }, status: "ACTIVE" },
    select: { permission: true },
  });
  return unionPermissions({
    sets: rows.map((row) => parseRolePermissions({ json: row.permission })),
  });
}
