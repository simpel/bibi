import { resolveLocale } from "@bibi/i18n";
import { defaultFinancePeriod } from "@/features/finance/finance-path";
import { financialsHref } from "@/features/finance/lib/finance-href";
import { redirect } from "@/lib/navigation";

type FinancialsStartProps = { params: Promise<{ locale: string; org: string }> };

/** Bare `/financials`: the default preset (`DEFAULT_PRESET`), in the organization's zone. */
export default async function FinancialsStart({ params }: FinancialsStartProps) {
  const { locale, org } = await params;
  redirect({
    href: financialsHref(await defaultFinancePeriod()),
    locale: resolveLocale({ value: locale }),
    org,
  });
}
