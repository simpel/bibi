import { setOnboardingStatus } from "@/features/user-preference/settings-actions";
import { authClient } from "@/lib/auth-client";
import { hasOAuthQuery } from "@/lib/oauth-query";
import { ROUTES } from "@/lib/routes";

export type AfterOrganizationInput = {
  router: { replace: (href: string) => void; refresh: () => void };
};

/**
 * Continues after an organization is active: in an OAuth flow resume authorize (Better Auth's
 * client then redirects to consent / the client), otherwise open the app. A user whose first
 * setup is pending is sent on to the onboarding by the app layout (ADR 0046).
 */
export async function afterOrganization({ router }: AfterOrganizationInput): Promise<void> {
  if (hasOAuthQuery({ search: window.location.search })) {
    await authClient.oauth2.continue({ postLogin: true });
    return;
  }
  router.replace(ROUTES.home);
  router.refresh();
}

/**
 * Continues after the user created an organization: its first setup is still ahead, so remember
 * that on the user (ADR 0046), then carry on as for any organization.
 */
export async function afterNewOrganization({ router }: AfterOrganizationInput): Promise<void> {
  await setOnboardingStatus({ onboardingStatus: "PENDING" });
  await afterOrganization({ router });
}
