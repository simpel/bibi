import { API_KEY_ROLES, type ApiKeyRole, ORG_ROLES, type OrgRole, statementsForRole } from "./permissions";

const rank = ({ role }: { role: OrgRole }): number => ORG_ROLES.indexOf(role);

const isOrgRole = ({ value }: { value: string }): boolean =>
  (ORG_ROLES as readonly string[]).includes(value);

export type ParseRolesInput = { role: string };

/** Better Auth stores member roles comma-separated (`"admin,member"`); unknown roles are dropped. */
export function parseRoles({ role }: ParseRolesInput): OrgRole[] {
  return role
    .split(",")
    .map((value) => value.trim())
    .filter((value) => isOrgRole({ value })) as OrgRole[];
}

export type HighestRoleInput = { roles: readonly OrgRole[] };

export function highestRole({ roles }: HighestRoleInput): OrgRole | null {
  return roles.reduce<OrgRole | null>(
    (best, role) => (best === null || rank({ role }) > rank({ role: best }) ? role : best),
    null,
  );
}

export type CapRoleInput = { role: OrgRole; cap: OrgRole };

/** The less privileged of `role` and `cap`. */
export function capRole({ role, cap }: CapRoleInput): OrgRole {
  return rank({ role }) <= rank({ role: cap }) ? role : cap;
}

export type RoleForKeyPermissionsInput = {
  permissions: Record<string, readonly string[]> | null | undefined;
};

/**
 * Most privileged API-key role whose full statement set the key holds. Keys narrower than
 * any role (e.g. only `venue:write`) fall back to the largest fully covered role, or null.
 */
export function roleForKeyPermissions({ permissions }: RoleForKeyPermissionsInput): ApiKeyRole | null {
  const granted = permissions ?? {};
  const covers = ({ role }: { role: ApiKeyRole }): boolean =>
    Object.entries(statementsForRole({ role })).every(([resource, actions]) =>
      actions.every((action) => granted[resource]?.includes(action) ?? false),
    );
  return [...API_KEY_ROLES].reverse().find((role) => covers({ role })) ?? null;
}
