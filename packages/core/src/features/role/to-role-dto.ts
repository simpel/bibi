import type { OrganizationRole } from "@okazi/db";
import {
  grantAll,
  normalizePermissions,
  type PermissionSet,
  PermissionSetSchema,
} from "../../permissions/permission-set";
import { OWNER_ROLE } from "../../permissions/resources";
import type { RoleDto } from "./schema";

export type ParseRolePermissionsInput = { json: string };

/** Stored JSON → normalized set. Malformed rows grant nothing (fail closed). */
export function parseRolePermissions({ json }: ParseRolePermissionsInput): PermissionSet {
  try {
    const parsed = PermissionSetSchema.safeParse(JSON.parse(json));
    return parsed.success ? normalizePermissions({ permissions: parsed.data }) : {};
  } catch {
    return {};
  }
}

export type ToRoleDtoInput = { row: OrganizationRole };

export function toRoleDto({ row }: ToRoleDtoInput): RoleDto {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.role,
    permissions: parseRolePermissions({ json: row.permission }),
    system: false,
    status: row.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
  };
}

/** Its id is the role name: the fixed role has no row in `organizationRole`. */
export const OWNER_ROLE_ID = OWNER_ROLE;

const OWNER_CREATED_AT = new Date(0);

export type OwnerRoleDtoInput = { organizationId: string };

/** The fixed `owner` role (ADR 0014), listed alongside the organization's own roles. */
export function ownerRoleDto({ organizationId }: OwnerRoleDtoInput): RoleDto {
  return {
    id: OWNER_ROLE_ID,
    organizationId,
    name: OWNER_ROLE,
    permissions: grantAll({ upTo: "admin" }),
    system: true,
    status: "ACTIVE",
    createdAt: OWNER_CREATED_AT,
    updatedAt: null,
    createdBy: null,
  };
}
