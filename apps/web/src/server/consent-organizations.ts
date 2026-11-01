import "server-only";
import { getAuth } from "@bibi/auth";
import { headers } from "next/headers";

import type { ConsentOrganization } from "@/features/auth/consent-organization-type";

export type ConsentOrganizations = {
  organizations: ConsentOrganization[];
  /** The active organization when the user is still a member of it, else their first. */
  defaultId: string | null;
};

/**
 * The organizations an OAuth client may be granted on the consent page. The token carries the
 * session's active organization at consent, so a stale one would give a token that every MCP
 * call refuses; the page makes the picked organization active before it consents.
 */
export async function loadConsentOrganizations(): Promise<ConsentOrganizations> {
  const requestHeaders = await headers();
  const auth = getAuth();
  const [session, organizations] = await Promise.all([
    auth.api.getSession({ headers: requestHeaders }),
    auth.api.listOrganizations({ headers: requestHeaders }),
  ]);
  const active = session?.session.activeOrganizationId;
  const list = organizations.map(({ id, name }) => ({ id, name }));
  const defaultId = list.find(({ id }) => id === active)?.id ?? list[0]?.id ?? null;
  return { organizations: list, defaultId };
}
