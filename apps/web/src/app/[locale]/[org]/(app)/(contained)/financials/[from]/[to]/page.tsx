import { resolveLocale } from "@bibi/i18n";
import { financialsHref } from "@/features/finance/lib/finance-href";
import { redirect } from "@/lib/navigation";

type OldFinancialsRouteProps = {
  params: Promise<{ locale: string; org: string; from: string; to: string }>;
  searchParams: Promise<{ customer?: string | string[] }>;
};

/** The old `/financials/{from}/{to}` (ADR 0077): the Financials tab of the dashboard (ADR 0086). */
export default async function OldFinancialsRoute({
  params,
  searchParams,
}: OldFinancialsRouteProps) {
  const { locale, org, from, to } = await params;
  const { customer } = await searchParams;
  const customerId = typeof customer === "string" && customer !== "" ? customer : undefined;
  redirect({
    href: financialsHref({ from, to, customerId }),
    locale: resolveLocale({ value: locale }),
    org,
  });
}
