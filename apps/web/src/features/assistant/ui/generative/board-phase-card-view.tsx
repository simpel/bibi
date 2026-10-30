"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle, ColorSwatch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";

export type BoardPhaseCardViewProps = GenerativeProps<"board-phase-card">;

/** One board column (ADR 0067): its colour and how many statuses it shows. */
export function BoardPhaseCardView({ phase }: BoardPhaseCardViewProps) {
  const t = useTranslations("assistant.ui.board");
  const active = phase.status === "ACTIVE";
  return (
    <Card data-slot="board-phase-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-base">
          <ColorSwatch color={phase.color} size="md" />
          {t("column", { name: phase.name })}
        </CardTitle>
        {active ? null : <Badge variant="outline">{t("archived")}</Badge>}
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{t("statuses", { count: phase.statusIds.length })}</p>
        <Link
          href={pipelineHref({ boardId: phase.boardId })}
          className="text-primary hover:underline"
        >
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
