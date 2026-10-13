import { hasPermission, type PermissionAction } from "@okazi/core";
import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * THE single place mapping Okazi permission strings (`<resource>:read|write|admin`) to roles.
 * New resource → add it to `RESOURCES`. Role → action semantics come from core's
 * `hasPermission`, so core authorization and Better Auth access control never drift.
 */
export const RESOURCES = ["venue", "room", "search"] as const;
export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ["read", "write", "admin"] as const satisfies readonly PermissionAction[];

/** Organization roles, ordered from least to most privileged. */
export const ORG_ROLES = ["viewer", "member", "admin", "owner"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

/** Access levels an API key can be issued with (never above `admin`). */
export const API_KEY_ROLES = ["viewer", "member", "admin"] as const;
export type ApiKeyRole = (typeof API_KEY_ROLES)[number];

export type ResourceStatements = Record<string, PermissionAction[]>;

export type StatementsForRoleInput = { role: string };

/** `{ venue: ["read", "write"], room: [...] }` – what `role` may do on each Okazi resource. */
export function statementsForRole({ role }: StatementsForRoleInput): ResourceStatements {
  return Object.fromEntries(
    RESOURCES.map((resource) => [
      resource,
      ACTIONS.filter((action) => hasPermission({ roles: [role], permission: `${resource}:${action}` })),
    ]),
  );
}

const allOkaziStatements: ResourceStatements = Object.fromEntries(
  RESOURCES.map((resource) => [resource, [...ACTIONS]]),
);

/** Better Auth access control: org plugin defaults + Okazi resources. */
export const accessControl = createAccessControl({ ...defaultStatements, ...allOkaziStatements });

/** Better Auth organization roles, each granting the core-defined Okazi statements. */
export const orgRoles = {
  owner: accessControl.newRole({ ...ownerAc.statements, ...statementsForRole({ role: "owner" }) }),
  admin: accessControl.newRole({ ...adminAc.statements, ...statementsForRole({ role: "admin" }) }),
  member: accessControl.newRole({
    ...memberAc.statements,
    ...statementsForRole({ role: "member" }),
  }),
  viewer: accessControl.newRole({
    ...memberAc.statements,
    ...statementsForRole({ role: "viewer" }),
  }),
};
