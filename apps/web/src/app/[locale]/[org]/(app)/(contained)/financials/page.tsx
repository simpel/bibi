import { resolveLocale } from "@bibi/i18n";
import { defaultFinancePeriod, financialsHref } from "@/features/finance/finance-path";
import { redirect } from "@/lib/navigation";

type FinancialsStartProps = { params: Promise<{ locale: string; org: string }> };

/** Bare `/financials`: the last 12 whole months, in the organization's zone. */
export default async function FinancialsStart({ params }: FinancialsStartProps) {
  const { locale, org } = await params;
  redirect({
    href: financialsHref(await defaultFinancePeriod()),
    locale: resolveLocale({ value: locale }),
    org,
  });
}
