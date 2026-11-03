import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { WorkOrderToday } from "@/features/work-order/ui/work-order-today";

type WorkOrdersTodayPageProps = { params: Promise<{ locale: string }> };

export default async function WorkOrdersTodayPage({ params }: WorkOrdersTodayPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="workOrder:read">
        <WorkOrderToday locale={locale} />
      </PermissionGate>
    </SimplePage>
  );
}
