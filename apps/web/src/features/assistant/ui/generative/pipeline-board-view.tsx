"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle, KanbanTaskCardStatic } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import { taskTimeLabel } from "@/features/task/lib/task-time-label";
import { Link } from "@/lib/navigation";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type PipelineBoardViewProps = GenerativeProps<"pipeline-board">;

/**
 * The pipeline as column (phase) counts, with the open tasks without an order after them (ADR
 * 0121) as task cards, read only; the full board is on `/pipeline?board=`.
 */
export function PipelineBoardView({ board }: PipelineBoardViewProps) {
  const t = useTranslations("assistant.ui.pipeline");
  const dates = useDateTimeFormat();
  const lanes = board.columns.map((column) => ({
    id: column.id,
    title: column.title,
    count:
      board.cards.filter((card) => card.columnId === column.id).length +
      board.taskCards.filter((card) => card.columnId === column.id).length,
  }));
  return (
    <Card data-slot="pipeline-board" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">
          {board.boardName ? `${t("title")} · ${board.boardName}` : t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 pt-0 text-sm">
        {board.cards.length + board.taskCards.length === 0 ? (
          <p className="text-muted-foreground">{t("empty")}</p>
        ) : null}
        <ul className="flex flex-wrap gap-2">
          {lanes.map((lane) => (
            <li key={lane.id}>
              <Badge variant="outline">
                {lane.title}: {lane.count}
              </Badge>
            </li>
          ))}
        </ul>
        {board.taskCards.length > 0 ? (
          <section aria-label={t("tasks")} className="grid gap-2">
            <h4 className="font-medium text-xs">{t("tasks")}</h4>
            <ul className="grid gap-2 sm:grid-cols-2">
              {board.taskCards.map((card) => (
                <li key={card.id}>
                  <KanbanTaskCardStatic
                    typeName={card.typeName}
                    customerName={null}
                    timeLabel={
                      card.dueAt
                        ? taskTimeLabel({ task: { dueAt: card.dueAt }, dates })
                        : t("noDueTime")
                    }
                    overdue={card.overdue}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <Link
          href={pipelineHref({ boardId: board.boardId })}
          className="text-primary hover:underline"
        >
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
