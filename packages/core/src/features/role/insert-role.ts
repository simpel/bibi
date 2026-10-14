import { createId } from "@paralleldrive/cuid2";
import type { Result } from "../../errors/result";
import { ok } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { normalizePermissions, type PermissionSet } from "../../permissions/permission-set";
import { checkCanGrant, roleNameTaken } from "./access";
import type { RoleDto } from "./schema";
import { toRoleDto } from "./to-role-dto";

export type FindActiveRoleByNameInput = {
  context: Pick<OperationContext, "db">;
  name: string;
};

export function findActiveRoleByName({ context, name }: FindActiveRoleByNameInput) {
  return context.db.organizationRole.findFirst({ where: { role: name } });
}

export type InsertRoleInput = {
  context: OperationContext;
  name: string;
  permissions: PermissionSet;
};

/** Shared by `role.create` and `role.importTemplate`: guard, insert, record. */
export async function insertRole({
  context,
  name,
  permissions,
}: InsertRoleInput): Promise<Result<RoleDto>> {
  const normalized = normalizePermissions({ permissions });
  const allowed = checkCanGrant({ context, permissions: normalized });
  if (!allowed.ok) return allowed;
  if (await findActiveRoleByName({ context, name })) return roleNameTaken({ name });
  const row = await context.db.organizationRole.create({
    data: {
      id: createId(),
      organizationId: context.organizationId,
      role: name,
      permission: JSON.stringify(normalized),
      status: "ACTIVE",
      createdBy: context.actor.userId,
    },
  });
  const role = toRoleDto({ row });
  context.recordChange({ entityId: role.id, after: role });
  return ok({ value: role });
}
