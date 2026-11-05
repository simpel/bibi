import { ok, type Result } from "@bibi/core";
import { getAuth } from "../get-auth";
import type { AuthSession } from "../require-session";
import { forbidden, unauthenticated } from "./errors";
import { loadMembership } from "./membership";
import type { Principal } from "./principal";

export type FromSessionInput = {
  headers: Headers;
  /** The session this request already resolved from the same cookie; skips a second lookup. */
  session?: AuthSession;
};

/** Session cookie → active organization on the session + live membership roles and permissions. */
export async function principalFromSession({
  headers,
  session: known,
}: FromSessionInput): Promise<Result<Principal>> {
  const session = known ?? (await getAuth().api.getSession({ headers }));
  if (!session) return unauthenticated({ message: "Sign in required" });
  const userId = session.user.id;
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) return forbidden({ message: "No active organization on the session" });
  const membership = await loadMembership({ userId, organizationId });
  const roles = membership?.roles ?? null;
  const permissions = membership?.permissions ?? {};
  return ok({ value: { userId, organizationId, roles, permissions, aiAllowed: false } });
}
