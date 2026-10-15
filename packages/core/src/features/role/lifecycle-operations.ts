import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { getRoleTemplate } from "../../templates/roles/role-templates";
import { memberHasRoleWhere } from "../member/member-roles";
import { checkNotOnSheets } from "../sheet-definition/usage";
import { ownerIsFixed, roleNotFound } from "./access";
import { findActiveRoleByName, insertRole } from "./insert-role";
import {
  RoleIdInputSchema,
  RoleImportTemplateInputSchema,
  RoleImportTemplateOutputSchema,
  RoleSchema,
} from "./schema";
import { OWNER_ROLE_ID, toRoleDto } from "./to-role-dto";

export const archiveRole = defineOperation({
  name: "role.archive",
  kind: "command",
  description:
    "Archive a role. Refused while any member or pending invitation still has it: reassign " +
    "them first (member.assignRole, member.cancelInvitation), and while a sheet definition " +
    "goes to it. The owner role cannot be archived.",
  input: RoleIdInputSchema,
  output: RoleSchema,
  permission: "role:admin",
  handler: async ({ input: { id }, context }) => {
    if (id === OWNER_ROLE_ID) return ownerIsFixed();
    const before = await context.db.organizationRole.findFirst({ where: { id } });
    if (!before) return roleNotFound();
    const holding = memberHasRoleWhere({ name: before.role });
    const [holders, invited] = await Promise.all([
      context.db.member.count({ where: holding }),
      context.db.invitation.count({ where: { ...holding, status: "pending" } }),
    ]);
    if (holders + invited > 0) {
      const message = `Role "${before.role}" is still assigned to members or invitations`;
      return err({ error: new AppError({ code: "CONFLICT", message }) });
    }
    const what = `Role "${before.role}"`;
    const onSheets = await checkNotOnSheets({ context, reference: { roleId: id }, what });
    if (!onSheets.ok) return onSheets;
    const row = await context.db.organizationRole.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    const role = toRoleDto({ row });
    context.recordChange({ entityId: id, before: toRoleDto({ row: before }), after: role });
    return ok({ value: role });
  },
});

export const importRoleTemplate = defineOperation({
  name: "role.importTemplate",
  kind: "command",
  description:
    "Import a role template (e.g. conference-venue) as editable roles of the organization. " +
    "Roles whose name already exists are skipped.",
  input: RoleImportTemplateInputSchema,
  output: RoleImportTemplateOutputSchema,
  permission: "role:admin",
  handler: async ({ input, context }) => {
    const created = [];
    const skipped: string[] = [];
    for (const { name, permissions } of getRoleTemplate({ key: input.template }).roles) {
      if (await findActiveRoleByName({ context, name })) {
        skipped.push(name);
        continue;
      }
      const role = await insertRole({ context, name, permissions });
      if (!role.ok) return role;
      created.push(role.value);
    }
    return ok({ value: { created, skipped } });
  },
});
