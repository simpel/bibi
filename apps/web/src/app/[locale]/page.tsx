import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { requireReadySession } from "@/server/guard";

type LocaleRootPageProps = { params: Promise<{ locale: string }> };

/** `/:locale` has no organization in it: open the active organization's home (ADR 0062). */
export default async function LocaleRootPage({ params }: LocaleRootPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { organizationSlug } = await requireReadySession({ locale });
  redirect({ href: ROUTES.home, locale, org: organizationSlug });
}
