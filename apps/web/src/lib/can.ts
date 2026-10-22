import type { Permission, PermissionAction, PermissionSet } from "@bibi/core";

export type CanPermissionInput = { permissions: PermissionSet; permission: Permission };

/**
 * Whether a permission set holds `<feature>:<action>` (ADR 0050). Pure, so client components
 * (the sidebar) can use it without importing core values; `self:*` is always granted.
 */
export function canPermission({ permissions, permission }: CanPermissionInput): boolean {
  const split = permission.lastIndexOf(":");
  const feature = permission.slice(0, split);
  if (feature === "self") return true;
  return permissions[feature]?.includes(permission.slice(split + 1) as PermissionAction) ?? false;
}

/** What a table's row actions may offer: the `edit` and `remove` of the row's feature. */
export type RowAccess = { canEdit: boolean; canRemove: boolean };
