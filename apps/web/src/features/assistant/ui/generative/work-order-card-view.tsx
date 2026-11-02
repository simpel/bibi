"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { WorkOrderMatches } from "@/features/work-order/ui/work-order-matches";
import { WorkOrderRowsView } from "@/features/work-order/ui/work-order-rows-view";
import { WorkOrderStatus } from "@/features/work-order/ui/work-order-status";
import { Link } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type WorkOrderCardViewProps = GenerativeProps<"work-order-card">;

/** One work order version: its status, the rows and the ★ changes since the last sent version. */
export function WorkOrderCardView({ workOrder }: WorkOrderCardViewProps) {
  const dates = useDateTimeFormat();
  const t = useTranslations("assistant.ui.workOrder");
  return (
    <Card data-slot="work-order-card" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{t("singular")}</CardTitle>
        <WorkOrderStatus dates={dates} workOrder={workOrder} />
      </CardHeader>
      <CardContent className="grid gap-2 p-4 pt-0">
        <WorkOrderMatches matches={workOrder.matches} />
        <WorkOrderRowsView dates={dates} content={workOrder.content} changes={workOrder.changes} />
        <Link
          href={ticketRoute({ id: workOrder.ticketId })}
          className="text-sm text-primary hover:underline"
        >
          {t("openTicket")}
        </Link>
      </CardContent>
    </Card>
  );
}
