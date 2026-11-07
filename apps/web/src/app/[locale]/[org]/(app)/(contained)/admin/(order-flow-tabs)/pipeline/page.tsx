import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { OrderStatusList } from "@/features/order-status/ui/order-status-list";
import { pageTitle } from "@/lib/page-metadata";

type OrderStatusesPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: OrderStatusesPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "orderStatuses" });
}

export default async function OrderStatusesPage({ params }: OrderStatusesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <OrderStatusList locale={locale} inTab />;
}
