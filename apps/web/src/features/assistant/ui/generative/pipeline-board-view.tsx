"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type PipelineBoardViewProps = GenerativeProps<"pipeline-board">;

/** The pipeline as lane counts; the full board is on `/pipeline`. */
export function PipelineBoardView({ board }: PipelineBoardViewProps) {
  const t = useTranslations("assistant.ui.pipeline");
  const statuses = useTranslations("inquiry.statuses");
  const lanes = board.columns.map((column) => ({
    id: column.id,
    title: column.inquiryStatus ? statuses(column.inquiryStatus) : column.title,
    count: board.cards.filter((card) => card.columnId === column.id).length,
  }));
  return (
    <Card data-slot="pipeline-board" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{t("title")}</CardTitle>
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
        <Link href={ROUTES.pipeline} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
