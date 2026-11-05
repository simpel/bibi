import "server-only";
import { type AuthSession, getAuth, requireSession } from "@bibi/auth";
import type { Result } from "@bibi/core";
import { headers } from "next/headers";
import { cache } from "react";

export type SessionState =
  | { status: "anonymous" }
  | { status: "needsOrganization"; session: AuthSession }
  | {
      status: "ready";
      session: AuthSession;
      organizationId: string;
      organizationSlug: string;
      organizationName: string;
    };

type ActiveSlugInput = { requestHeaders: Headers; organizationId: string };

/** The active organization's slug and name, from the member's own organizations (ADR 0062). */
async function activeOrganizationOf({ requestHeaders, organizationId }: ActiveSlugInput) {
  const organizations = await getAuth().api.listOrganizations({ headers: requestHeaders });
  return organizations.find((organization) => organization.id === organizationId);
}

/**
 * The signed-in session of the current request, looked up once and shared by the session state
 * and the execute context (ADR 0097).
 */
export const getRequestSession = cache(async (): Promise<Result<AuthSession>> => {
  return requireSession({ headers: await headers() });
});

/**
 * Where the current request stands in the sign-in → pick organization flow. An active
 * organization the user is no longer a member of counts as none. Cached per request.
 */
export const getSessionState = cache(async (): Promise<SessionState> => {
  const requestHeaders = await headers();
  const result = await getRequestSession();
  if (!result.ok) return { status: "anonymous" };
  const organizationId = result.value.session.activeOrganizationId;
  if (!organizationId) return { status: "needsOrganization", session: result.value };
  const active = await activeOrganizationOf({ requestHeaders, organizationId });
  if (!active) return { status: "needsOrganization", session: result.value };
  const organization = { organizationSlug: active.slug, organizationName: active.name };
  return { status: "ready", session: result.value, organizationId, ...organization };
});
