import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { WorkOrderDocument } from "@/features/work-order/ui/work-order-document";

type WorkOrderPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function WorkOrderPage({ params }: WorkOrderPageProps) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale({ value: raw });
  setRequestLocale(locale);
  return (
    <PermissionGate permission="workOrder:read">
      <WorkOrderDocument locale={locale} id={id} />
    </PermissionGate>
  );
}
