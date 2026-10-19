import { createId } from "@paralleldrive/cuid2";
import {
  type Actor,
  createExecuteContext,
  type ExecuteContext,
  type FixedRole,
  type PermissionSet,
  PRESET_PERMISSIONS,
} from "../src/index";

/** Shorthand for a preset (ADR 0050): read → member, write → manager, admin → admin. */
export type TestAccess = "read" | "write" | "admin";

export type TestContextInput = {
  organizationId?: string;
  /** The preset's permissions (default `admin`), or explicit `permissions`. */
  access?: TestAccess;
  permissions?: PermissionSet;
  /** The caller's fixed role (ADR 0034); defaults to the preset of `access`. */
  role?: FixedRole;
  actor?: Actor;
};

const ROLE_FOR_ACCESS: Record<TestAccess, FixedRole> = {
  read: "member",
  write: "manager",
  admin: "admin",
};

/** Fresh org per call: tests never share rows, so no cleanup is needed. */
export function testContext({
  organizationId = `org_${createId()}`,
  access = "admin",
  role = ROLE_FOR_ACCESS[access],
  permissions = PRESET_PERMISSIONS[role],
  actor = { type: "user", userId: `user_${createId()}` },
}: TestContextInput = {}): ExecuteContext {
  return createExecuteContext({ organizationId, roles: [role], permissions, actor });
}

export type UnwrapInput<T> = { result: { ok: true; value: T } | { ok: false; error: Error } };

export function unwrap<T>({ result }: UnwrapInput<T>): T {
  if (!result.ok) throw result.error;
  return result.value;
}

export type ErrorCodeInput = { result: { ok: true } | { ok: false; error: { code: string } } };

/** `null` for success, else the AppError code (for compact assertions). */
export function errorCode({ result }: ErrorCodeInput): string | null {
  return result.ok ? null : result.error.code;
}

export type PeerInput = { of: ExecuteContext; access?: TestAccess };

/** Another user in the same organization (read + write by default). */
export function peer({ of, access = "write" }: PeerInput): ExecuteContext {
  return testContext({ organizationId: of.organizationId, access });
}
