import { prefillMemberProfile } from "@bibi/core";
import { recordKnownMember } from "@bibi/core/known-member";
import { getLogger } from "@bibi/logger";

export type PrefillHookInput = { user: { id: string }; organization: { id: string } };

/**
 * `afterAddMember` and `afterAcceptInvitation`: the new member's profile here starts from their
 * own phone and photo (ADR 0072), and they are known here, so domain join never re-adds them after
 * a removal (ADR 0078). Idempotent; a failure is logged, never the joining user's error.
 */
export async function prefillMemberHook({ user, organization }: PrefillHookInput): Promise<void> {
  await recordKnownMember({ organizationId: organization.id, userId: user.id }).catch(
    (error: unknown) => getLogger().warn({ event: "auth.knownMemberFailed", err: error }),
  );
  await prefillMemberProfile({ organizationId: organization.id, userId: user.id }).catch(
    (error: unknown) => getLogger().warn({ event: "auth.memberPrefillFailed", err: error }),
  );
}
