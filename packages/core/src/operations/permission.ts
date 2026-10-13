export type PermissionAction = "read" | "write" | "admin";

/** `<resource>:<action>`, e.g. `venue:write`. */
export type Permission = `${string}:${PermissionAction}`;

/** Org roles (Better Auth organization plugin) → allowed actions on any resource. */
const ROLE_ACTIONS: Record<string, readonly PermissionAction[]> = {
  owner: ["read", "write", "admin"],
  admin: ["read", "write", "admin"],
  member: ["read", "write"],
  viewer: ["read"],
};

export type HasPermissionInput = { roles: readonly string[]; permission: Permission };

export function hasPermission({ roles, permission }: HasPermissionInput): boolean {
  const action = permission.slice(permission.lastIndexOf(":") + 1) as PermissionAction;
  return roles.some((role) => ROLE_ACTIONS[role]?.includes(action) ?? false);
}
