"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle, ColorSwatch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";

export type BoardCardViewProps = GenerativeProps<"board-card">;

/** One board (ADR 0067): its columns in order with how many statuses each shows. */
export function BoardCardView({ board }: BoardCardViewProps) {
  const t = useTranslations("assistant.ui.board");
  const active = board.status === "ACTIVE";
  return (
    <Card data-slot="board-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{t("title", { name: board.name })}</CardTitle>
        {active ? null : <Badge variant="outline">{t("archived")}</Badge>}
      </CardHeader>
      <CardContent className="grid gap-3 p-4 pt-0 text-sm">
        <p className="text-muted-foreground">{t("columns", { count: board.phases.length })}</p>
        <ul className="flex flex-wrap gap-2">
          {board.phases.map((phase) => (
            <li key={phase.id}>
              <Badge variant="outline" className="gap-1.5">
                <ColorSwatch color={phase.color} />
                {phase.name}: {t("statuses", { count: phase.statusIds.length })}
              </Badge>
            </li>
          ))}
        </ul>
        {active ? (
          <Link href={pipelineHref({ boardId: board.id })} className="text-primary hover:underline">
            {t("open")}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
