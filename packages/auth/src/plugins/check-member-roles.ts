import { OWNER_ROLE } from "@okazi/core";
import { getDb } from "@okazi/db";
import { APIError } from "better-auth/api";

export type AssertKnownRolesInput = { organizationId: string; role: string | readonly string[] };

/**
 * Better Auth's `addMember` does not validate role names and its invitation check counts
 * archived roles. Members may only get `owner` or one of the organization's ACTIVE roles
 * (ADR 0020), so a dormant name can never start granting access later.
 */
export async function assertKnownRoles({ organizationId, role }: AssertKnownRolesInput) {
  const names = (Array.isArray(role) ? role : String(role).split(","))
    .map((name) => name.trim())
    .filter((name) => name !== "" && name !== OWNER_ROLE);
  if (names.length === 0) return;
  const rows = await getDb().organizationRole.findMany({
    where: { organizationId, role: { in: names }, status: "ACTIVE" },
    select: { role: true },
  });
  const unknown = names.filter((name) => !rows.some((row) => row.role === name));
  if (unknown.length > 0) {
    throw new APIError("BAD_REQUEST", { message: `Unknown role(s): ${unknown.join(", ")}` });
  }
}
