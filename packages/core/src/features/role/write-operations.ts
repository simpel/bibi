import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { normalizePermissions } from "../../permissions/permission-set";
import { checkCanGrant, ownerIsFixed, roleNameTaken, roleNotFound } from "./access";
import { findActiveRoleByName, insertRole } from "./insert-role";
import { renameOnMembers } from "./rename-on-members";
import { RoleCreateInputSchema, RoleSchema, RoleUpdateInputSchema } from "./schema";
import { OWNER_ROLE_ID, parseRolePermissions, toRoleDto } from "./to-role-dto";

export const createRole = defineOperation({
  name: "role.create",
  kind: "command",
  description:
    "Create a role: a name plus what it may do per resource (read < write < admin; a higher " +
    "action includes the lower). You cannot grant more than you have yourself.",
  input: RoleCreateInputSchema,
  output: RoleSchema,
  permission: "role:admin",
  handler: ({ input, context }) =>
    insertRole({ context, name: input.name, permissions: input.permissions }),
});

export const updateRole = defineOperation({
  name: "role.update",
  kind: "command",
  description:
    "Rename a role and/or replace its permissions. Members keep the role (renamed). The owner " +
    "role is fixed. You cannot grant more than you have yourself.",
  input: RoleUpdateInputSchema,
  output: RoleSchema,
  permission: "role:admin",
  handler: async ({ input: { id, name, permissions }, context }) => {
    if (id === OWNER_ROLE_ID) return ownerIsFixed();
    const before = await context.db.organizationRole.findFirst({ where: { id } });
    if (!before) return roleNotFound();
    const next = permissions
      ? normalizePermissions({ permissions })
      : parseRolePermissions({ json: before.permission });
    if (permissions) {
      const allowed = checkCanGrant({ context, permissions: next });
      if (!allowed.ok) return allowed;
    }
    const renamed = name !== undefined && name !== before.role;
    if (renamed && (await findActiveRoleByName({ context, name }))) return roleNameTaken({ name });
    const row = await context.db.organizationRole.update({
      where: { id },
      data: { role: name ?? before.role, permission: JSON.stringify(next) },
    });
    if (renamed) await renameOnMembers({ context, from: before.role, to: row.role });
    const role = toRoleDto({ row });
    context.recordChange({ entityId: id, before: toRoleDto({ row: before }), after: role });
    return ok({ value: role });
  },
});
