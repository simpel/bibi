import { err, fromUnknown, isPermissionSubset, OWNER_ROLE, ok, type Result } from "@okazi/core";
import { z } from "zod";
import { getAuth } from "../get-auth";
import { requireSession } from "../require-session";
import { forbidden } from "../resolve/errors";
import { loadMembership } from "../resolve/membership";
import { resolveRolePermissions } from "../resolve/role-permissions";

export const CreateOrgApiKeyInputSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1).max(32),
  /** One of the organization's roles. `owner` is never allowed (keys are capped below it). */
  role: z.string().trim().min(1).max(64),
  /** Seconds until expiry; omit for a non-expiring key. */
  expiresIn: z.number().int().positive().optional(),
});

export type CreateOrgApiKeyInput = z.input<typeof CreateOrgApiKeyInputSchema> & {
  headers: Headers;
};

/** Plain key is returned once and never stored (only its hash). */
export type CreatedApiKey = { id: string; key: string; start: string | null };

/**
 * Issues an API key for the signed-in user, bound to `organizationId` and one of its roles.
 * The caller must be a member, and the role may not grant more than the caller has.
 */
export async function createOrgApiKey({
  headers,
  ...input
}: CreateOrgApiKeyInput): Promise<Result<CreatedApiKey>> {
  const session = await requireSession({ headers });
  if (!session.ok) return session;
  const { organizationId, name, role, expiresIn } = CreateOrgApiKeyInputSchema.parse(input);
  const userId = session.value.user.id;
  const membership = await loadMembership({ userId, organizationId });
  if (!membership) return forbidden({ message: "Not a member of the organization" });
  if (role === OWNER_ROLE) return forbidden({ message: "API keys cannot have the owner role" });
  const permissions = await resolveRolePermissions({ organizationId, roles: [role] });
  if (!isPermissionSubset({ subset: permissions, of: membership.permissions })) {
    return forbidden({ message: `Cannot issue a key with role ${role}: it exceeds your access` });
  }
  try {
    const created = await getAuth().api.createApiKey({
      body: {
        userId,
        name,
        metadata: { organizationId, role },
        ...(expiresIn ? { expiresIn } : {}),
      },
    });
    return ok({ value: { id: created.id, key: created.key, start: created.start } });
  } catch (error) {
    return err({ error: fromUnknown({ error }) });
  }
}
