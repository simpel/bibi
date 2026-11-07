import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { BillingSettings } from "@/features/billing/ui/billing-settings";
import { pageTitle } from "@/lib/page-metadata";

type BillingPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: BillingPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "billing" });
}

/** Bibi's subscription, seats and seat requests (ADR 0095); admins only. */
export default async function BillingPage({ params }: BillingPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <BillingSettings locale={locale} />
    </SimplePage>
  );
}
