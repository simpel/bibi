import { err, fromUnknown, ok, type Result } from "@okazi/core";
import { z } from "zod";
import { getAuth } from "../get-auth";
import { API_KEY_ROLES, statementsForRole } from "../permissions";
import { requireSession } from "../require-session";
import { forbidden } from "../resolve/errors";
import { loadMemberRoles } from "../resolve/membership";
import { capRole, highestRole } from "../roles";

export const CreateOrgApiKeyInputSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1).max(32),
  role: z.enum(API_KEY_ROLES).default("viewer"),
  /** Seconds until expiry; omit for a non-expiring key. */
  expiresIn: z.number().int().positive().optional(),
});

export type CreateOrgApiKeyInput = z.input<typeof CreateOrgApiKeyInputSchema> & {
  headers: Headers;
};

/** Plain key is returned once and never stored (only its hash). */
export type CreatedApiKey = { id: string; key: string; start: string | null };

/**
 * Issues an API key for the signed-in user, bound to `organizationId`. The caller must be a
 * member, and `role` may not exceed the caller's own role in that organization.
 */
export async function createOrgApiKey({
  headers,
  ...input
}: CreateOrgApiKeyInput): Promise<Result<CreatedApiKey>> {
  const session = await requireSession({ headers });
  if (!session.ok) return session;
  const { organizationId, name, role, expiresIn } = CreateOrgApiKeyInputSchema.parse(input);
  const userId = session.value.user.id;
  const memberRole = highestRole({ roles: await loadMemberRoles({ userId, organizationId }) });
  if (!memberRole) return forbidden({ message: "Not a member of the organization" });
  if (capRole({ role, cap: memberRole }) !== role) {
    return forbidden({ message: `Cannot issue a ${role} key with role ${memberRole}` });
  }
  try {
    const created = await getAuth().api.createApiKey({
      body: {
        userId,
        name,
        metadata: { organizationId },
        permissions: statementsForRole({ role }),
        ...(expiresIn ? { expiresIn } : {}),
      },
    });
    return ok({ value: { id: created.id, key: created.key, start: created.start } });
  } catch (error) {
    return err({ error: fromUnknown({ error }) });
  }
}
