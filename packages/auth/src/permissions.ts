import { ADMIN_ROLE, FIXED_ROLES, type FixedRole } from "@bibi/core";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, ownerAc } from "better-auth/plugins/organization/access";

/** Better Auth access control: only its own organization-plugin statements (ADR 0034). */
export const accessControl = createAccessControl(defaultStatements);

/**
 * Better Auth's own `owner` statements, given to `admin`, minus `ac` (role CRUD), `member:update`/`delete`
 * (role assignment, removal) and `invitation` (invite, cancel): those go through core
 * `member.*` so they are authorized and audited there. Better Auth's endpoints for them are
 * therefore closed to everyone.
 */
const adminAuthStatements = {
  ...ownerAc.statements,
  ac: [],
  invitation: [],
  member: ownerAc.statements.member.filter((action) => action !== "update" && action !== "delete"),
};

type OrgRoles = Record<FixedRole, ReturnType<typeof accessControl.newRole>>;

/**
 * The fixed roles as Better Auth roles. Only `admin` gets Better Auth statements (updating or
 * deleting the organization itself); every Bibi permission comes from the presets and overrides in core (ADR 0050).
 */
export const orgRoles = Object.fromEntries(
  FIXED_ROLES.map((role) => [
    role,
    accessControl.newRole(role === ADMIN_ROLE ? adminAuthStatements : {}),
  ]),
) as OrgRoles;
