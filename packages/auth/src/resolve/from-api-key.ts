import { intersectPermissions, ok, type Result } from "@okazi/core";
import { z } from "zod";
import { getAuth } from "../get-auth";
import { forbidden, unauthenticated } from "./errors";
import { loadMembership } from "./membership";
import type { Principal } from "./principal";
import { resolveRolePermissions } from "./role-permissions";

const KeyMetadataSchema = z.object({
  organizationId: z.string().min(1),
  role: z.string().min(1).optional(),
});

export type FromApiKeyInput = { key: string };

/**
 * API key → owner (`referenceId`) + `metadata.organizationId`. Effective permissions are the
 * owner's live membership permissions ∩ the key role's live permissions, so a key never
 * outranks its owner nor its role. A key without a role grants nothing.
 */
export async function principalFromApiKey({ key }: FromApiKeyInput): Promise<Result<Principal>> {
  const result = await getAuth().api.verifyApiKey({ body: { key } });
  if (!result.valid || !result.key) return unauthenticated({ message: "Invalid API key" });
  const metadata = KeyMetadataSchema.safeParse(result.key.metadata);
  if (!metadata.success) return forbidden({ message: "API key is not bound to an organization" });
  const userId = result.key.referenceId;
  const { organizationId, role } = metadata.data;
  const membership = await loadMembership({ userId, organizationId });
  const keyPermissions = role
    ? await resolveRolePermissions({ organizationId, roles: [role] })
    : {};
  const permissions = intersectPermissions({ a: membership?.permissions ?? {}, b: keyPermissions });
  const roles = membership && role ? [role] : null;
  return ok({ value: { userId, organizationId, roles, permissions, aiAllowed: false } });
}
