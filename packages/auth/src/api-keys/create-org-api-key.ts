import {
  err,
  fromUnknown,
  GrantableRoleSchema,
  OWNER_ROLE,
  ok,
  type Result,
  roleRank,
} from "@okazi/core";
import { z } from "zod";
import { getAuth } from "../get-auth";
import { requireSession } from "../require-session";
import { forbidden } from "../resolve/errors";
import { loadMembership } from "../resolve/membership";

export const CreateOrgApiKeyInputSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1).max(32),
  /** A fixed role (ADR 0034): viewer, member or admin, never `owner` nor above the caller's own. */
  role: GrantableRoleSchema,
  /** Seconds until expiry; omit for a non-expiring key. */
  expiresIn: z.number().int().positive().optional(),
});

export type CreateOrgApiKeyInput = z.input<typeof CreateOrgApiKeyInputSchema> & {
  headers: Headers;
};

/** Plain key is returned once and never stored (only its hash). */
export type CreatedApiKey = { id: string; key: string; start: string | null };

/**
 * Issues an API key for the signed-in user, bound to `organizationId` and a fixed role.
 * The caller must be a member, and the role may not be above the caller's own.
 */
export async function createOrgApiKey({
  headers,
  ...input
}: CreateOrgApiKeyInput): Promise<Result<CreatedApiKey>> {
  const session = await requireSession({ headers });
  if (!session.ok) return session;
  // Untyped callers can still send `owner`: refuse it as FORBIDDEN, not as a malformed input.
  if ((input.role as string) === OWNER_ROLE) {
    return forbidden({ message: "API keys cannot have the owner role" });
  }
  const parsed = CreateOrgApiKeyInputSchema.safeParse(input);
  if (!parsed.success) return err({ error: fromUnknown({ error: parsed.error }) });
  const { organizationId, name, role, expiresIn } = parsed.data;
  const userId = session.value.user.id;
  const membership = await loadMembership({ userId, organizationId });
  if (!membership) return forbidden({ message: "Not a member of the organization" });
  if (roleRank({ role }) > roleRank({ role: membership.role ?? "" })) {
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
