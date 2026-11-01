import "server-only";
import type { AuthSession } from "@bibi/auth";
import { type JoinableOrganizations, loadJoinableOrganizations } from "@bibi/auth";

/** What `/welcome` and `/welcome/organizations` offer the signed-in user (ADR 0076). */
export async function loadJoinable({
  session,
}: {
  session: AuthSession;
}): Promise<JoinableOrganizations> {
  const { id, email } = session.user;
  return loadJoinableOrganizations({ userId: id, email });
}
