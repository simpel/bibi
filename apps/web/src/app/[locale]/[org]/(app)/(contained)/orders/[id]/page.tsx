import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { loadOrder } from "@/features/order/load-order";
import { OrderDetail } from "@/features/order/ui/order-detail";
import { entityTitle } from "@/lib/page-metadata";

type OrderPageProps = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: OrderPageProps) {
  const { id } = await params;
  const order = await loadOrder({ id });
  if (order.ok) {
    const title = order.value.reference
      ? `#${order.value.reference} ${order.value.title ?? ""}`.trim()
      : order.value.title;
    return entityTitle({ name: title, fallback: "Order" });
  }
  return entityTitle({ fallback: "Order" });
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const [{ locale: rawLocale, id }, { tab }] = await Promise.all([params, searchParams]);
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <OrderDetail locale={locale} id={id} tab={tab} />;
}
