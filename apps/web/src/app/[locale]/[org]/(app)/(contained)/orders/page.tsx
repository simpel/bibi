import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { type OrderSearchParams, readOrderListParams } from "@/features/order/lib/list-params";
import { OrderList } from "@/features/order/ui/order-list";
import { pageTitle } from "@/lib/page-metadata";

type OrdersPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<OrderSearchParams>;
};

export async function generateMetadata({ params }: OrdersPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "orders" });
}

export default async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <OrderList locale={locale} params={readOrderListParams({ params: await searchParams })} />
    </SimplePage>
  );
}
