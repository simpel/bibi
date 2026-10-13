import { ok, type Result } from "@okazi/core";
import { getAuth } from "../get-auth";
import { forbidden, unauthenticated } from "./errors";
import { loadMemberRoles } from "./membership";
import type { Principal } from "./principal";

export type FromSessionInput = { headers: Headers };

/** Session cookie → active organization on the session + live membership roles. */
export async function principalFromSession({
  headers,
}: FromSessionInput): Promise<Result<Principal>> {
  const session = await getAuth().api.getSession({ headers });
  if (!session) return unauthenticated({ message: "Sign in required" });
  const userId = session.user.id;
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) return forbidden({ message: "No active organization on the session" });
  const roles = await loadMemberRoles({ userId, organizationId });
  return ok({ value: { userId, organizationId, roles, aiAllowed: false } });
}
