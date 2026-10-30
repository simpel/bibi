"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";

export type PipelineBoardViewProps = GenerativeProps<"pipeline-board">;

/** The pipeline as column (phase) counts; the full board is on `/pipeline?board=`. */
export function PipelineBoardView({ board }: PipelineBoardViewProps) {
  const t = useTranslations("assistant.ui.pipeline");
  const lanes = board.columns.map((column) => ({
    id: column.id,
    title: column.title,
    count: board.cards.filter((card) => card.columnId === column.id).length,
  }));
  return (
    <Card data-slot="pipeline-board" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">
          {board.boardName ? `${t("title")} · ${board.boardName}` : t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 pt-0 text-sm">
        {board.cards.length === 0 ? <p className="text-muted-foreground">{t("empty")}</p> : null}
        <ul className="flex flex-wrap gap-2">
          {lanes.map((lane) => (
            <li key={lane.id}>
              <Badge variant="outline">
                {lane.title}: {lane.count}
              </Badge>
            </li>
          ))}
        </ul>
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
