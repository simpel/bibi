import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { type PermissionSet, unionPermissions } from "../../permissions/permission-set";
import { parseRolePermissions } from "../role/to-role-dto";

export type ResolveAssignedRolesInput = {
  context: Pick<OperationContext, "db">;
  names: readonly string[];
};

type RoleRow = { role: string; permission: string };

const findRoles = async ({ context, names }: ResolveAssignedRolesInput): Promise<RoleRow[]> =>
  context.db.organizationRole.findMany({
    where: { role: { in: [...names] } },
    select: { role: true, permission: true },
  });

const grantedBy = ({ rows }: { rows: readonly RoleRow[] }): PermissionSet =>
  unionPermissions({ sets: rows.map((row) => parseRolePermissions({ json: row.permission })) });

/** Every name must be an active role of the organization; returns what they grant together. */
export async function resolveAssignedRoles({
  context,
  names,
}: ResolveAssignedRolesInput): Promise<Result<PermissionSet>> {
  const rows = await findRoles({ context, names });
  const unknown = names.filter((name) => !rows.some((row) => row.role === name));
  if (unknown.length > 0) {
    const message = `Unknown role(s): ${unknown.join(", ")}`;
    return err({ error: new AppError({ code: "VALIDATION", message }) });
  }
  return ok({ value: grantedBy({ rows }) });
}

/** What the names grant today; unknown or archived names grant nothing (like `packages/auth`). */
export async function grantedByRoles({
  context,
  names,
}: ResolveAssignedRolesInput): Promise<PermissionSet> {
  return grantedBy({ rows: await findRoles({ context, names }) });
}
