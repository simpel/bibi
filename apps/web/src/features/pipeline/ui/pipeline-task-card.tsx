import { KanbanTaskCardContent } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { taskTimeLabel } from "@/features/task/lib/task-time-label";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { TaskBoardCard } from "../lib/kanban-model";

export type PipelineTaskCardContentProps = {
  /** `customerName` is null without a customer or when the caller may not view customers. */
  card: TaskBoardCard;
};

/**
 * A task card on the board (ADR 0121): the task look (outlined in the task colour, never filled)
 * with the type, the customer, the due time (red when overdue) and the assignee. A click opens
 * the task (`PipelineBoardView`'s `onOpenCard`).
 */
export function PipelineTaskCardContent({ card }: PipelineTaskCardContentProps) {
  const t = useTranslations("pipeline");
  const dates = useDateTimeFormat();
  const { dueAt } = card;
  return (
    <KanbanTaskCardContent
      typeName={card.typeName}
      customerName={card.customerName}
      timeLabel={dueAt ? taskTimeLabel({ task: { dueAt }, dates }) : t("noDueTime")}
      overdue={card.overdue}
      assigneeName={card.assigneeName}
    />
  );
}
