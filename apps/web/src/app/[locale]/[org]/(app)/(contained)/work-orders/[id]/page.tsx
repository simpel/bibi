import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { WorkOrderDetail } from "@/features/work-order/ui/work-order-detail";

type WorkOrderPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function WorkOrderPage({ params }: WorkOrderPageProps) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale({ value: raw });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="workOrder:read">
        <WorkOrderDetail locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
