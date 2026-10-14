import { authClient } from "@/lib/auth-client";
import { hasOAuthQuery } from "@/lib/oauth-query";
import { ROUTES } from "@/lib/routes";

export type AfterOrganizationInput = {
  router: { replace: (href: string) => void; refresh: () => void };
};

/**
 * Continues after an organization is active: in an OAuth flow resume authorize (Better Auth's
 * client then redirects to consent / the client), otherwise open the app.
 */
export async function afterOrganization({ router }: AfterOrganizationInput): Promise<void> {
  if (hasOAuthQuery({ search: window.location.search })) {
    await authClient.oauth2.continue({ postLogin: true });
    return;
  }
  router.replace(ROUTES.venues);
  router.refresh();
}
