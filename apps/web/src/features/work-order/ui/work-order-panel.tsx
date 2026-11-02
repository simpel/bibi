import type { WorkOrderDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { getDateTimeFormat } from "@/server/date-time-format";
import { GenerateWorkOrderButton } from "./generate-work-order-button";
import { SendWorkOrderButton } from "./send-work-order-button";
import { WorkOrderMatches } from "./work-order-matches";
import { WorkOrderRowsView } from "./work-order-rows-view";
import { WorkOrderStatus } from "./work-order-status";

export type WorkOrderPanelProps = {
  ticketId: string;
  definition: { id: string; name: string };
  /** The newest version for the ticket, or null before the first one. */
  workOrder: WorkOrderDto | null;
  canGenerate: boolean;
  canSend: boolean;
};

/** One work order definition on the ticket page: its newest version and the way to the next. */
export async function WorkOrderPanel({
  ticketId,
  definition,
  workOrder,
  canGenerate,
  canSend,
}: WorkOrderPanelProps) {
  const [t, dates] = await Promise.all([getTranslations("workOrder"), getDateTimeFormat()]);
  return (
    <article data-slot="work-order-panel" className="grid gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">{definition.name}</h3>
        <div className="flex gap-2">
          {canGenerate ? (
            <GenerateWorkOrderButton ticketId={ticketId} workOrderDefinitionId={definition.id} />
          ) : null}
          {canSend && workOrder && !workOrder.sentAt && !workOrder.blocked ? (
            <SendWorkOrderButton id={workOrder.id} />
          ) : null}
        </div>
      </div>
      {workOrder ? (
        <>
          <WorkOrderStatus workOrder={workOrder} dates={dates} />
          <WorkOrderMatches matches={workOrder.matches} />
          <WorkOrderRowsView
            content={workOrder.content}
            changes={workOrder.changes}
            dates={dates}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noVersion")}</p>
      )}
    </article>
  );
}
