import { getAuth } from "@bibi/auth";
import { getLogger } from "@bibi/logger";
import type { NextRequest, NextResponse } from "next/server";
import { orgSlugFromPathname } from "@/lib/org-path";

/** Better Auth's session cookie, with or without the `__Secure-` prefix. */
const SESSION_COOKIE = /session_token$/;

export type SyncActiveOrganizationInput = { request: NextRequest; response: NextResponse };

type ActivateInput = { request: NextRequest; slug: string };

/** The id of the slug's organization when the user is a member and it is not active yet. */
async function organizationToActivate({ request, slug }: ActivateInput) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return undefined;
  const organizations = await auth.api.listOrganizations({ headers: request.headers });
  const target = organizations.find((organization) => organization.slug === slug);
  if (!target || target.id === session.session.activeOrganizationId) return undefined;
  return target.id;
}

/**
 * Keeps the session's active organization in step with the URL (ADR 0062): on `/:locale/:slug/...`
 * a member's organization becomes active and the cookie Better Auth sets is forwarded. Anyone
 * else is left alone, so the `[org]` layout returns 404. Only runs with a session cookie.
 */
export async function syncActiveOrganization({
  request,
  response,
}: SyncActiveOrganizationInput): Promise<void> {
  const slug = orgSlugFromPathname({ pathname: request.nextUrl.pathname });
  if (!slug || response.headers.has("location")) return;
  if (!request.cookies.getAll().some(({ name }) => SESSION_COOKIE.test(name))) return;
  try {
    const organizationId = await organizationToActivate({ request, slug });
    if (!organizationId) return;
    const { headers } = await getAuth().api.setActiveOrganization({
      headers: request.headers,
      body: { organizationId },
      returnHeaders: true,
    });
    for (const cookie of headers.getSetCookie()) response.headers.append("set-cookie", cookie);
    getLogger().info({ event: "organization.activatedFromUrl", organizationId });
  } catch (error) {
    getLogger().warn({ event: "organization.activateFromUrlFailed", err: error });
  }
}
