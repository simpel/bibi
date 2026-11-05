import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { BillingAdminView } from "@/features/admin/billing/billing-admin-view";
import { pageTitle } from "@/lib/page-metadata";

type AdminBillingPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata() {
  return pageTitle({ namespace: "admin", key: "billing.title" });
}

export default async function AdminBillingPage({ params }: AdminBillingPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <BillingAdminView locale={locale} />;
}
