import { prefillMemberProfile } from "@bibi/core";
import { getLogger } from "@bibi/logger";

export type PrefillHookInput = { user: { id: string }; organization: { id: string } };

/**
 * `afterAddMember` and `afterAcceptInvitation`: the new member's profile here starts from their
 * own phone and photo (ADR 0072). Idempotent; a failure is logged, never the joining user's error.
 */
export async function prefillMemberHook({ user, organization }: PrefillHookInput): Promise<void> {
  await prefillMemberProfile({ organizationId: organization.id, userId: user.id }).catch(
    (error: unknown) => getLogger().warn({ event: "auth.memberPrefillFailed", err: error }),
  );
}
