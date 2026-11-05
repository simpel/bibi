import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { loadOrder } from "@/features/order/load-order";
import { OrderUpdate } from "@/features/order/ui/order-update";
import { entityTitle } from "@/lib/page-metadata";

type UpdateOrderPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: UpdateOrderPageProps) {
  const { id } = await params;
  const order = await loadOrder({ id });
  if (order.ok) {
    const title = order.value.reference
      ? `#${order.value.reference} ${order.value.title ?? ""}`.trim()
      : order.value.title;
    return entityTitle({ name: title, fallback: "Order", prefix: "Edit" });
  }
  return entityTitle({ fallback: "Order", prefix: "Edit" });
}

export default async function UpdateOrderPage({ params }: UpdateOrderPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="order:write">
        <OrderUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
