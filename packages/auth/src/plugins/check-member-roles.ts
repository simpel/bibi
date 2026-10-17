import { isFixedRole } from "@okazi/core";
import { APIError } from "better-auth/api";

export type AssertFixedRoleInput = { role: string | readonly string[] };

/**
 * Better Auth's `addMember` does not validate role names (invitations are created by core
 * `member.invite`, which does). A member gets exactly one fixed role (ADR 0034).
 */
export function assertFixedRole({ role }: AssertFixedRoleInput): void {
  const name = Array.isArray(role) ? role.join(",") : String(role);
  if (!isFixedRole({ role: name.trim() })) {
    throw new APIError("BAD_REQUEST", { message: `Not a fixed role: ${name}` });
  }
}
