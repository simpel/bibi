import { type PermissionAction, SELF_FEATURE } from "../permissions/features";
import type { PermissionSet } from "../permissions/permission-set";

export type { PermissionAction } from "../permissions/features";

/** `<feature>:<action>`, e.g. `ticket:edit` (ADR 0050). */
export type Permission = `${string}:${PermissionAction}`;

export type HasPermissionInput = { permissions: PermissionSet; permission: Permission };

/**
 * Checks the caller's effective permissions (ADR 0050). `packages/auth` resolves preset +
 * overrides to a normalized `PermissionSet` once per request, so this is an exact lookup.
 * `self:*` (the caller's own space) is granted to every caller.
 */
export function hasPermission({ permissions, permission }: HasPermissionInput): boolean {
  const split = permission.lastIndexOf(":");
  const feature = permission.slice(0, split);
  const action = permission.slice(split + 1) as PermissionAction;
  // Everyone may act in their own space; the rows are pinned to them (ADR 0039).
  if (feature === SELF_FEATURE) return true;
  return permissions[feature]?.includes(action) ?? false;
}
