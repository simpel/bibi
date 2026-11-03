import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { BillingAdminView } from "@/features/admin/billing/billing-admin-view";

type AdminBillingPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function AdminBillingPage({ params, searchParams }: AdminBillingPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { cursor } = await searchParams;
  return <BillingAdminView locale={locale} cursor={Array.isArray(cursor) ? cursor[0] : cursor} />;
}
