import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { loadOrderStatus } from "@/features/order-status/load-order-status";
import { OrderStatusUpdate } from "@/features/order-status/ui/order-status-update";
import { entityTitle } from "@/lib/page-metadata";

type UpdateOrderStatusPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: UpdateOrderStatusPageProps) {
  const { id } = await params;
  const status = await loadOrderStatus({ id });
  return entityTitle({
    name: status.ok ? status.value.name : null,
    fallback: "Status",
    prefix: "Edit",
  });
}

export default async function UpdateOrderStatusPage({ params }: UpdateOrderStatusPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="pipeline:write">
        <OrderStatusUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
