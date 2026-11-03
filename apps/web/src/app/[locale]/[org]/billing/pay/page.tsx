import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { safeReturnTo } from "@/features/billing/lib/return-to";
import { PayView } from "@/features/billing/ui/pay-view";

type PayPageProps = {
  params: Promise<{ locale: string; org: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

/** The trial is over and nothing pays (ADR 0095 §5): pay, or remind an admin. */
export default async function PayPage({ params, searchParams }: PayPageProps) {
  const { locale: raw, org } = await params;
  const locale = resolveLocale({ value: raw });
  setRequestLocale(locale);
  const returnTo = safeReturnTo({ value: (await searchParams).returnTo });
  return <PayView locale={locale} org={org} returnTo={returnTo} />;
}
