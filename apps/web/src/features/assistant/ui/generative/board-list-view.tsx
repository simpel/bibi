"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type BoardListViewProps = GenerativeProps<"board-list">;

/** The organization's boards in order; the first is the default. Each links to its pipeline. */
export function BoardListView({ items, nextCursor }: BoardListViewProps) {
  const t = useTranslations("assistant.ui.board");
  return (
    <Card data-slot="board-list" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{t("boards")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 p-4 pt-0 text-sm">
        {items.length === 0 ? <p className="text-muted-foreground">{t("empty")}</p> : null}
        <ul className="grid gap-1">
          {items.map((board, index) => (
            <li key={board.id} className="flex items-center gap-2">
              <Link
                href={pipelineHref({ boardId: board.id })}
                className="text-primary hover:underline"
              >
                {board.name}
              </Link>
              <span className="text-muted-foreground">
                {t("columns", { count: board.phases.length })}
              </span>
              {index === 0 ? <Badge variant="secondary">{t("default")}</Badge> : null}
            </li>
          ))}
        </ul>
        <MoreHint nextCursor={nextCursor} />
      </CardContent>
    </Card>
  );
}
