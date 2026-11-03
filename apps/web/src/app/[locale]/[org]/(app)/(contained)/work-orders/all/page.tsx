import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import {
  readWorkOrderListParams,
  type WorkOrderSearchParams,
} from "@/features/work-order/lib/list-params";
import { WorkOrderList } from "@/features/work-order/ui/work-order-list";

type WorkOrdersAllPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<WorkOrderSearchParams>;
};

export default async function WorkOrdersAllPage({ params, searchParams }: WorkOrdersAllPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="workOrder:read">
        <WorkOrderList
          locale={locale}
          params={readWorkOrderListParams({ params: await searchParams })}
        />
      </PermissionGate>
    </SimplePage>
  );
}
