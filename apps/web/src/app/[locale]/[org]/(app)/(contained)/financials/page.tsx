import { resolveLocale } from "@bibi/i18n";
import { defaultTabHref } from "@/features/dashboard/dashboard-path";
import { redirect } from "@/lib/navigation";

type OldFinancialsStartProps = { params: Promise<{ locale: string; org: string }> };

/** The old `/financials` (ADR 0077): Financials is a dashboard tab since ADR 0086. */
export default async function OldFinancialsStart({ params }: OldFinancialsStartProps) {
  const { locale, org } = await params;
  const href = await defaultTabHref({ tab: "financials" });
  redirect({ href, locale: resolveLocale({ value: locale }), org });
}
