import "server-only";
import { type AuthSession, getAuth, requireSession } from "@bibi/auth";
import { headers } from "next/headers";
import { cache } from "react";

export type SessionState =
  | { status: "anonymous" }
  | { status: "needsOrganization"; session: AuthSession }
  | { status: "ready"; session: AuthSession; organizationId: string; organizationSlug: string };

type ActiveSlugInput = { requestHeaders: Headers; organizationId: string };

/** The active organization's slug, from the member's own organizations (ADR 0062). */
async function activeSlugOf({ requestHeaders, organizationId }: ActiveSlugInput) {
  const organizations = await getAuth().api.listOrganizations({ headers: requestHeaders });
  return organizations.find((organization) => organization.id === organizationId)?.slug;
}

/**
 * Where the current request stands in the sign-in → pick organization flow. An active
 * organization the user is no longer a member of counts as none. Cached per request.
 */
export const getSessionState = cache(async (): Promise<SessionState> => {
  const requestHeaders = await headers();
  const result = await requireSession({ headers: requestHeaders });
  if (!result.ok) return { status: "anonymous" };
  const organizationId = result.value.session.activeOrganizationId;
  if (!organizationId) return { status: "needsOrganization", session: result.value };
  const organizationSlug = await activeSlugOf({ requestHeaders, organizationId });
  if (!organizationSlug) return { status: "needsOrganization", session: result.value };
  return { status: "ready", session: result.value, organizationId, organizationSlug };
});
