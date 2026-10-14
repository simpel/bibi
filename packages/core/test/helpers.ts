import { createId } from "@paralleldrive/cuid2";
import {
  type Actor,
  createExecuteContext,
  type ExecuteContext,
  grantAll,
  type PermissionAction,
  type PermissionSet,
} from "../src/index";

export type TestContextInput = {
  organizationId?: string;
  /** Every resource up to this action (default `admin`), or explicit `permissions`. */
  access?: PermissionAction;
  permissions?: PermissionSet;
  actor?: Actor;
};

/** Fresh org per call: tests never share rows, so no cleanup is needed. */
export function testContext({
  organizationId = `org_${createId()}`,
  access = "admin",
  permissions = grantAll({ upTo: access }),
  actor = { type: "user", userId: `user_${createId()}` },
}: TestContextInput = {}): ExecuteContext {
  return createExecuteContext({ organizationId, roles: [access], permissions, actor });
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

export type PeerInput = { of: ExecuteContext; access?: PermissionAction };

/** Another user in the same organization (read + write by default). */
export function peer({ of, access = "write" }: PeerInput): ExecuteContext {
  return testContext({ organizationId: of.organizationId, access });
}
