import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { requireReadySession } from "@/server/guard";

type SelectOrganizationPageProps = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

/**
 * The way into the app now that `/:locale` is the public front page (ADR 0073): opens the active
 * organization's home (ADR 0062), `/welcome` without one, `/login` when signed out.
 */
export default async function SelectOrganizationPage({ params }: SelectOrganizationPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { organizationSlug } = await requireReadySession({ locale });
  redirect({ href: ROUTES.home, locale, org: organizationSlug });
}
