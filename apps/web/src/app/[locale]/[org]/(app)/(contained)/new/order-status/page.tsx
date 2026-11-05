import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { OrderStatusCreate } from "@/features/order-status/ui/order-status-create";
import { pageTitle } from "@/lib/page-metadata";

type NewOrderStatusPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: NewOrderStatusPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "orderStatus", key: "create" });
}

export default async function NewOrderStatusPage({ params }: NewOrderStatusPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return (
    <SimplePage>
      <PermissionGate permission="pipeline:write">
        <OrderStatusCreate />
      </PermissionGate>
    </SimplePage>
  );
}
