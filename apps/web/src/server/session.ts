import "server-only";
import { type AuthSession, requireSession } from "@okazi/auth";
import { headers } from "next/headers";

export type SessionState =
  | { status: "anonymous" }
  | { status: "needsOrganization"; session: AuthSession }
  | { status: "ready"; session: AuthSession; organizationId: string };

/** Where the current request stands in the sign-in → pick organization flow. */
export async function getSessionState(): Promise<SessionState> {
  const result = await requireSession({ headers: await headers() });
  if (!result.ok) return { status: "anonymous" };
  const organizationId = result.value.session.activeOrganizationId;
  if (!organizationId) return { status: "needsOrganization", session: result.value };
  return { status: "ready", session: result.value, organizationId };
}
