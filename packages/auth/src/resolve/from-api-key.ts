import { GrantableRoleSchema, ok, type Result, weakerRole } from "@okazi/core";
import { z } from "zod";
import { getAuth } from "../get-auth";
import { rolePermissions } from "../roles/role-permissions";
import { forbidden, unauthenticated } from "./errors";
import { loadMembership } from "./membership";
import type { Principal } from "./principal";

const KeyMetadataSchema = z.object({
  organizationId: z.string().min(1),
  role: z.string().min(1).optional(),
});

export type FromApiKeyInput = { key: string };

/**
 * API key → owner (`referenceId`) + `metadata.organizationId`. The key acts with the weaker of
 * its own fixed role and the owner's live role (ADR 0034), so it never outranks either. A key
 * without a valid role (or `owner`) grants nothing.
 */
export async function principalFromApiKey({ key }: FromApiKeyInput): Promise<Result<Principal>> {
  const result = await getAuth().api.verifyApiKey({ body: { key } });
  if (!result.valid || !result.key) return unauthenticated({ message: "Invalid API key" });
  const metadata = KeyMetadataSchema.safeParse(result.key.metadata);
  if (!metadata.success) return forbidden({ message: "API key is not bound to an organization" });
  const userId = result.key.referenceId;
  const { organizationId } = metadata.data;
  const membership = await loadMembership({ userId, organizationId });
  if (!membership) {
    return ok({
      value: { userId, organizationId, roles: null, permissions: {}, aiAllowed: false },
    });
  }
  const keyRole = GrantableRoleSchema.safeParse(metadata.data.role);
  const role =
    keyRole.success && membership.role ? weakerRole({ a: keyRole.data, b: membership.role }) : null;
  const roles = role ? [role] : [];
  const permissions = rolePermissions({ role });
  return ok({ value: { userId, organizationId, roles, permissions, aiAllowed: false } });
}
