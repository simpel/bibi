import { authClient } from "@/lib/auth-client";
import { hasOAuthQuery } from "@/lib/oauth-query";
import { ROUTES } from "@/lib/routes";

export type AfterOrganizationInput = {
  router: { replace: (href: string, options?: { org?: string }) => void; refresh: () => void };
  /** The now active organization's slug (ADR 0062). */
  slug: string;
};

/**
 * Continues after an organization is active: in an OAuth flow resume authorize (Better Auth's
 * client then redirects to consent / the client), otherwise open the app. A user whose first
 * setup is pending is sent on to the onboarding by the app layout (ADR 0061).
 */
export async function afterOrganization({ router, slug }: AfterOrganizationInput): Promise<void> {
  if (hasOAuthQuery({ search: window.location.search })) {
    await authClient.oauth2.continue({ postLogin: true });
    return;
  }
  router.replace(ROUTES.welcome, { org: slug });
  router.refresh();
}

/**
 * Continues after the user created an organization: provisioning already left its first setup
 * `PENDING` (ADR 0061), so carry on as for any organization.
 */
export async function afterNewOrganization({
  router,
  slug,
}: AfterOrganizationInput): Promise<void> {
  await afterOrganization({ router, slug });
}
