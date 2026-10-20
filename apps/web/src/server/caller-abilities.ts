import "server-only";
import { resolveExecuteContext } from "@okazi/auth";
import {
  type Feature,
  type FixedRole,
  highestRole,
  type Permission,
  type PermissionSet,
} from "@okazi/core";
import { headers } from "next/headers";
import { canPermission, type RowAccess } from "@/lib/can";

export type CallerAbilities = {
  /** The caller's effective permissions (ADR 0050). */
  permissions: PermissionSet;
  /** The caller's fixed role (ADR 0034); `null` when not a member or no fixed role. */
  role: FixedRole | null;
  /** The signed-in user (for follow and "Assigned to me"); null when not resolved. */
  userId: string | null;
};

const NONE: CallerAbilities = {
  permissions: {},
  role: null,
  userId: null,
};

/**
 * What the signed-in user's effective permissions allow (preset + overrides, ADR 0050), for
 * hiding buttons and pages that would only fail (the operations still enforce everything). Uses
 * the same resolver as `runOperation`. `permissions` also answers view questions (`canView`).
 */
export async function getCallerAbilities(): Promise<CallerAbilities> {
  const context = await resolveExecuteContext({ headers: await headers() });
  if (!context.ok) return NONE;
  const { permissions, roles, actor } = context.value;
  return {
    permissions,
    role: highestRole({ roles }),
    userId: actor.userId,
  };
}

export type CanInput = { abilities: Pick<CallerAbilities, "permissions">; permission: Permission };

/** Precise check against the effective permissions, e.g. `item:write` for "New item". */
export function can({ abilities, permission }: CanInput): boolean {
  return canPermission({ permissions: abilities.permissions, permission });
}

export type RowAccessInput = { abilities: Pick<CallerAbilities, "permissions">; feature: Feature };

/** `edit` and `remove` of one feature, for a table's row actions. */
export function rowAccess({ abilities, feature }: RowAccessInput): RowAccess {
  return {
    canEdit: can({ abilities, permission: `${feature}:write` }),
    canRemove: can({ abilities, permission: `${feature}:delete` }),
  };
}
