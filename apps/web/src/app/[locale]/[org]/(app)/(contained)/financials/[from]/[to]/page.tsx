import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { defaultFinancePeriod, financialsHref } from "@/features/finance/finance-path";
import { isValidPeriod } from "@/features/finance/lib/finance-period";
import { FinancialsPage } from "@/features/finance/ui/financials-page";
import { redirect } from "@/lib/navigation";

type FinancialsRouteProps = {
  params: Promise<{ locale: string; org: string; from: string; to: string }>;
};

/** The organization's money from `{from}` to `{to}`, inclusive, at most 24 months (ADR 0077). */
export default async function FinancialsRoute({ params }: FinancialsRouteProps) {
  const { org, from, to, ...rest } = await params;
  const locale = resolveLocale({ value: rest.locale });
  setRequestLocale(locale);
  if (!isValidPeriod({ from, to })) {
    redirect({ href: financialsHref(await defaultFinancePeriod()), locale, org });
  }
  return <FinancialsPage locale={locale} from={from} to={to} />;
}
