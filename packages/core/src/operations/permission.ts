import type { PermissionSet } from "../permissions/permission-set";
import type { PermissionAction } from "../permissions/resources";

export type { PermissionAction } from "../permissions/resources";

/** `<resource>:<action>`, e.g. `venue:write`. */
export type Permission = `${string}:${PermissionAction}`;

export type HasPermissionInput = { permissions: PermissionSet; permission: Permission };

/**
 * Checks the caller's resolved permissions (ADR 0014). `packages/auth` resolves the member's
 * roles to a normalized `PermissionSet` once per request, so this is an exact lookup.
 */
export function hasPermission({ permissions, permission }: HasPermissionInput): boolean {
  const split = permission.lastIndexOf(":");
  const resource = permission.slice(0, split);
  const action = permission.slice(split + 1) as PermissionAction;
  return permissions[resource]?.includes(action) ?? false;
}
