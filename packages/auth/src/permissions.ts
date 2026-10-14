import { grantAll, OWNER_ROLE, type PermissionSet } from "@okazi/core";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, ownerAc } from "better-auth/plugins/organization/access";

type Statements = Record<string, readonly string[]>;

const allOkaziStatements = grantAll({ upTo: "admin" }) as Statements;

/**
 * Better Auth and Okazi share the resource name `member` (Better Auth: create/update/delete,
 * Okazi: read/write/admin), so statements are merged per resource, never overwritten.
 */
const mergeStatements = ({ a, b }: { a: Statements; b: Statements }) =>
  Object.fromEntries(
    [...new Set([...Object.keys(a), ...Object.keys(b)])].map((resource) => [
      resource,
      [...new Set([...(a[resource] ?? []), ...(b[resource] ?? [])])],
    ]),
  );

/** Better Auth access control: org plugin statements + Okazi resources. */
export const accessControl = createAccessControl(
  mergeStatements({ a: defaultStatements, b: allOkaziStatements }),
);

/**
 * Better Auth's own statements for `owner`, minus `ac` (role CRUD), `member:update`/`delete`
 * (role assignment, removal) and `invitation` (invite, cancel): those go through core `role.*`
 * and `member.*` so they are authorized and audited there. Better Auth's endpoints for them are
 * therefore closed to everyone.
 */
const ownerAuthStatements = {
  ...ownerAc.statements,
  ac: [],
  invitation: [],
  member: ownerAc.statements.member.filter((action) => action !== "update" && action !== "delete"),
};

/**
 * Static Better Auth roles. Only `owner` is real (ADR 0020); every other role lives in
 * `organizationRole` (dynamic access control). Better Auth's built-in `admin` and `member`
 * are overridden with no statements so a custom role with that name gains nothing extra.
 */
export const orgRoles = {
  [OWNER_ROLE]: accessControl.newRole(
    mergeStatements({ a: ownerAuthStatements, b: allOkaziStatements }),
  ),
  admin: accessControl.newRole({}),
  member: accessControl.newRole({}),
};

/** Every Okazi permission: what `owner` resolves to. */
export function ownerPermissions(): PermissionSet {
  return grantAll({ upTo: "admin" });
}
